import asyncio
import re
import json
import httpx
from collections import Counter
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from app.scanner.models import ScanReport
from app.auth.models import User
from pathlib import Path

from app.scanner.deps_scanner import audit_dependencies

BATCH_SIZE = 10

SEVERITY_ORDER = {
    "CRITICAL": 0,
    "HIGH": 1,
    "MEDIUM": 2,
    "LOW": 3,
}

RULES_PATH = Path(__file__).parent / "security_rules.json"

def load_security_rules() -> list[tuple[str, str, re.Pattern]]:
    with open(RULES_PATH, "r", encoding="utf-8") as f:
        raw_rules = json.load(f)
    return [
        (item["severity"], item["rule"], re.compile(item["pattern"]))
        for item in raw_rules
    ]

SECURITY_RULES = load_security_rules()

IGNORED_FILES = ("scanner/service.py", "scanner\\service.py", "package-lock.json", "yarn.lock")

IGNORED_DIRS = ("node_modules/", "venv/", ".venv/", "__pycache__/", ".git/", "migrations/", "dist/", "build/")

ALLOWED_EXTENSIONS = (".py", ".js", ".jsx", ".ts", ".tsx", ".env", ".yml", ".yaml", ".json", ".c", ".cpp", ".h", ".php")


def calculate_security_score(issues: list[dict]) -> int:
    counts = Counter(i["severity"] for i in issues)
    penalty = counts["CRITICAL"] * 25 + counts["HIGH"] * 12 + counts["MEDIUM"] * 5
    return max(0, 100 - penalty)

def detect_frameworks(all_paths: list[str], combined_configs: str) -> list[str]:
    """Определяем фреймворки и инфраструктуру по файлам и зависимостям."""
    stack = []
    paths_lower = [p.lower() for p in all_paths]
    cfg_lower = combined_configs.lower()

    if any("dockerfile" in p for p in paths_lower):
        stack.append("Docker")
    if any("docker-compose" in p for p in paths_lower):
        stack.append("Docker Compose")
    if any(".github/workflows" in p for p in paths_lower):
        stack.append("GitHub Actions")

    if (
        "django" in cfg_lower
        or any(p.endswith(("manage.py", "wsgi.py", "asgi.py")) for p in paths_lower)
        or (any(p.endswith("settings.py") for p in paths_lower) and any(p.endswith("urls.py") for p in paths_lower))
    ):
        stack.append("Django")

    if "djangorestframework" in cfg_lower or any(p.endswith("serializers.py") for p in paths_lower):
        stack.append("Django REST Framework")

    if "fastapi" in cfg_lower:
        stack.append("FastAPI")
    if "flask" in cfg_lower:
        stack.append("Flask")
    if "sqlalchemy" in cfg_lower:
        stack.append("SQLAlchemy")

    if '"react"' in cfg_lower or any(p.endswith((".jsx", ".tsx")) for p in paths_lower):
        stack.append("React")
    if '"vite"' in cfg_lower or any("vite.config" in p for p in paths_lower):
        stack.append("Vite")
    if '"next"' in cfg_lower or any("next.config" in p for p in paths_lower):
        stack.append("Next.js")
    if "tailwindcss" in cfg_lower or any("tailwind.config" in p for p in paths_lower):
        stack.append("Tailwind CSS")
    if "pika" in cfg_lower or "aio-pika" in cfg_lower or "celery" in cfg_lower:
        stack.append("RabbitMQ / Queue")

    return stack


async def process_scan_job(report_id: int, db: Session):
    """Фоновая задача сканирования с сохранением прогресса каждые 10 файлов."""
    report = db.query(ScanReport).filter(ScanReport.id == report_id).first()
    if not report:
        return

    user = db.query(User).filter(User.id == report.user_id).first()
    if not user:
        report.status = "failed"
        db.commit()
        return

    report.status = "scanning"
    db.commit()

    repo_full_name = report.repo_full_name
    headers = {
        "Authorization": f"Bearer {user.github_token}",
        "Accept": "application/vnd.github.v3+json",
    }

    api_host = "https://" + "api." + "github.com"
    raw_host = "https://" + "raw." + "githubusercontent.com"

    try:
        async with httpx.AsyncClient(timeout=30.0, trust_env=False) as client:
            # 1. Информация о репозитории и ветка по умолчанию
            repo_res = await client.get(f"{api_host}/repos/{repo_full_name}", headers=headers)
            if repo_res.status_code != 200:
                report.status = "failed"
                db.commit()
                return
            repo_data = repo_res.json()
            default_branch = repo_data.get("default_branch", "main")

            # 2. Количество коммитов
            commits_count = 1
            commits_res = await client.get(
                f"{api_host}/repos/{repo_full_name}/commits?sha={default_branch}&per_page=1",
                headers=headers,
            )
            if commits_res.status_code == 200:
                link_header = commits_res.headers.get("Link", "")
                match = re.search(r'page=(\d+)>; rel="last"', link_header)
                commits_count = int(match.group(1)) if match else len(commits_res.json())

            # 3. Языки репозитория
            langs_res = await client.get(f"{api_host}/repos/{repo_full_name}/languages", headers=headers)
            languages = {}
            if langs_res.status_code == 200:
                raw_langs = langs_res.json()
                total_bytes = sum(raw_langs.values()) or 1
                languages = {
                    lang: round((bytes_count / total_bytes) * 100, 1)
                    for lang, bytes_count in raw_langs.items()
                }

            # 4. Дерево всех файлов
            tree_res = await client.get(
                f"{api_host}/repos/{repo_full_name}/git/trees/{default_branch}?recursive=1",
                headers=headers,
            )
            if tree_res.status_code != 200:
                report.status = "failed"
                db.commit()
                return

            all_blobs = [item["path"] for item in tree_res.json().get("tree", []) if item["type"] == "blob"]

            files = [
                path
                for path in all_blobs
                if path.endswith(ALLOWED_EXTENSIONS)
                and not any(path.endswith(ignored) for ignored in IGNORED_FILES)
                and not any(ignored_dir in path for ignored_dir in IGNORED_DIRS)
            ]

            current_issues = []
            config_texts = []
            scanned_file_list = []
            config_pairs = []
            total_lines = 0
            scanned_count = 0

            # Начальный статус для фронтенда до старта первого батча
            report.stack = {
                "languages": languages,
                "frameworks": detect_frameworks(all_blobs, ""),
            }
            report.stats = {
                "commits": commits_count,
                "total_files": len(all_blobs),
                "target_files": len(files),
                "scanned_files": 0,
                "total_lines": 0,
                "stars": repo_data.get("stargazers_count", 0),
                "default_branch": default_branch,
                "security_score": 100,
            }
            db.commit()

            # 5. Сканирование батчами
            semaphore = asyncio.Semaphore(15)

            async def scan_single_file(file_path: str):
                async with semaphore:
                    raw_url = f"{raw_host}/{repo_full_name}/{default_branch}/{file_path}"
                    try:
                        file_res = await client.get(raw_url, headers=headers)
                    except httpx.RequestError:
                        return file_path, 0, None, []

                    if file_res.status_code != 200:
                        return file_path, 0, None, []

                    text = file_res.text
                    lines = text.splitlines()
                    cfg = text if file_path.lower().endswith(("requirements.txt", "package.json", "pyproject.toml")) else None
                    file_issues = []

                    for line_num, line_text in enumerate(lines, start=1):
                        stripped = line_text.strip()
                        if stripped.startswith(("#", "//", '("CRITICAL"', '("HIGH"', '("MEDIUM"', 'r"', "r'")):
                            continue
                        for severity, rule_name, pattern in SECURITY_RULES:
                            if re.search(pattern, line_text):
                                file_issues.append({
                                    "file": file_path,
                                    "line": line_num,
                                    "severity": severity,
                                    "rule": rule_name,
                                    "snippet": stripped[:120],
                                })
                    return file_path, len(lines), cfg, file_issues

            for i in range(0, len(files), BATCH_SIZE):
                batch = files[i : i + BATCH_SIZE]
                batch_results = await asyncio.gather(*(scan_single_file(fp) for fp in batch))

                for f_path, lines_cnt, cfg_content, file_issues in batch_results:
                    total_lines += lines_cnt
                    if cfg_content:
                        config_texts.append(cfg_content)
                        config_pairs.append((f_path, cfg_content))
                    current_issues.extend(file_issues)
                    scanned_file_list.append({
                        "path": f_path,
                        "lines": lines_cnt,
                        "issues": len(file_issues),
                    })

                scanned_count += len(batch)

                sorted_issues = sorted(
                    current_issues,
                    key=lambda x: (SEVERITY_ORDER.get(x["severity"], 99), x["file"], x["line"]),
                )

                report.issues = sorted_issues
                report.stack = {
                    "languages": languages,
                    "frameworks": detect_frameworks(all_blobs, "\n".join(config_texts)),
                }
                
                report.stats = {
                    **report.stats,
                    "scanned_files": scanned_count,
                    "total_lines": total_lines,
                    "security_score": calculate_security_score(current_issues),
                    "files_list": list(scanned_file_list),
                }

                flag_modified(report, "issues")
                flag_modified(report, "stack")
                flag_modified(report, "stats")
                db.commit()
                

            dependencies = await audit_dependencies(config_pairs)
            vuln_deps_count = sum(1 for d in dependencies if d["vulns"])

            base_score = calculate_security_score(current_issues)
            final_score = max(0, base_score - vuln_deps_count * 10)

            report.stats = {
                **report.stats,
                "security_score": final_score,
                "dependencies": dependencies,
                "vulnerable_deps_count": vuln_deps_count,
            }
            flag_modified(report, "stats")

            report.status = "completed"
            db.commit()
    except Exception as e:
        import traceback
        traceback.print_exc()
        report.status = "failed"
        db.commit()