import re
import httpx

# Базовые правила SAST-анализатора
SECURITY_RULES = [
    ("CRITICAL", "Утечка приватного ключа", r"-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    ("HIGH", "Хардкод пароля или секрета", r"(?i)(password|secret|api_key|token)\s*=\s*['\"][^'\"]{6,}['\"]"),
    ("HIGH", "Токен GitHub / AWS", r"(ghp_[a-zA-Z0-9]{36}|AKIA[0-9A-Z]{16})"),
    ("HIGH", "Опасный вызов eval() / exec()", r"\b(eval|exec)\s*\("),
    ("MEDIUM", "Потенциальная SQL-инъекция (f-string в запросе)", r"(?i)(SELECT|INSERT|UPDATE|DELETE).*\{.*\}"),
    ("MEDIUM", "Отключена проверка SSL (verify=False)", r"verify\s*=\s*False"),
]

IGNORED_FILES = ("scanner/service.py", "scanner\\service.py", "package-lock.json", "yarn.lock")

ALLOWED_EXTENSIONS = (".py", ".js", ".jsx", ".ts", ".tsx", ".env", ".yml", ".yaml", ".json")

async def run_security_scan(repo_full_name: str, gh_token: str) -> list[dict]:
    headers = {"Authorization": f"Bearer {gh_token}", "Accept": "application/vnd.github.v3+json"}
    issues = []

    api_host = "https://" + "api." + "github.com"
    raw_host = "https://" + "raw." + "githubusercontent.com"

    async with httpx.AsyncClient(timeout=15.0, trust_env=False) as client:
        # Получаем информацию о репозитории, чтобы узнать ветку по умолчанию
        repo_info = await client.get(f"{api_host}/repos/{repo_full_name}", headers=headers)
        if repo_info.status_code != 200:
            return []
        default_branch = repo_info.json().get("default_branch", "main")

        # Получаем дерево всех файлов репозитория
        tree_res = await client.get(
            f"{api_host}/repos/{repo_full_name}/git/trees/{default_branch}?recursive=1",
            headers=headers,
        )
        if tree_res.status_code != 200:
            return []

        files = [
            item["path"]
            for item in tree_res.json().get("tree", [])
            if item["type"] == "blob"
            and item["path"].endswith(ALLOWED_EXTENSIONS)
            and not any(item["path"].endswith(ignored) for ignored in IGNORED_FILES)
        ][:50]

        for file_path in files:
            raw_url = f"{raw_host}/{repo_full_name}/{default_branch}/{file_path}"
            file_res = await client.get(raw_url, headers=headers)
            if file_res.status_code != 200:
                continue

            lines = file_res.text.splitlines()
            for line_num, line_text in enumerate(file_res.text.splitlines(), start=1):
                stripped = line_text.strip()
                # Пропускаем описания правил самого сканера и комментарии
                if stripped.startswith(("#", "//", '("CRITICAL"', '("HIGH"', '("MEDIUM"', 'r"', "r'")):
                    continue

                for severity, rule_name, pattern in SECURITY_RULES:
                    if re.search(pattern, line_text):
                        issues.append({
                            "file": file_path,
                            "line": line_num,
                            "severity": severity,
                            "rule": rule_name,
                            "snippet": stripped[:120],
                        })
    return issues