import re
import httpx

SECURITY_RULES = [
    ("CRITICAL", "Утечка приватного ключа", r"-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    ("HIGH", "Хардкод пароля или секрета", r"(?i)(password|secret|api_key|token)\s*=\s*['\"][^'\"]{6,}['\"]"),
    ("HIGH", "Токен GitHub / AWS", r"(ghp_[a-zA-Z0-9]{36}|AKIA[0-9A-Z]{16})"),
    ("HIGH", "Опасный вызов eval() / exec()", r"\b(eval|exec)\s*\("),
    ("MEDIUM", "Потенциальная SQL-инъекция (f-string в запросе)", r"(?i)(SELECT|INSERT|UPDATE|DELETE).*\{.*\}"),
    ("MEDIUM", "Отключена проверка SSL (verify=False)", r"verify\s*=\s*False"),
]

ALLOWED_EXTENSIONS = (".py", ".js", ".jsx", ".ts", ".tsx", ".env", ".yml", ".yaml", ".json")

async def run_security_scan(repo_full_name: str, gh_token: str) -> list[dict]:
    headers = {
        "Authorization": f"Bearer {gh_token}",
        "Accept": "application/vnd.github.v3+json",
    }
    issues = []

    async with httpx.AsyncClient(timeout=20.0) as client:
        repo_info = await client.get(
            f"https://github.com{repo_full_name}",
            headers=headers,
        )
        if repo_info.status_code != 200:
            raise RuntimeError(f"Не удалось получить метаданные репозитория: {repo_info.status_code}")

        default_branch = repo_info.json().get("default_branch", "main")

        tree_res = await client.get(
            f"https://github.com{repo_full_name}/git/trees/{default_branch}?recursive=1",
            headers=headers,
        )
        if tree_res.status_code != 200:
            raise RuntimeError(f"Не удалось получить дерево файлов: {tree_res.status_code}")

        files = [
            item["path"]
            for item in tree_res.json().get("tree", [])
            if item["type"] == "blob" and item["path"].endswith(ALLOWED_EXTENSIONS)
        ][:150]  # Лимит увеличен для фонового воркера

        for file_path in files:
            raw_url = f"https://githubusercontent.com{repo_full_name}/{default_branch}/{file_path}"
            file_res = await client.get(raw_url, headers=headers)
            if file_res.status_code != 200:
                continue

            lines = file_res.text.splitlines()
            for line_num, line_text in enumerate(lines, start=1):
                for severity, rule_name, pattern in SECURITY_RULES:
                    if re.search(pattern, line_text):
                        issues.append({
                            "file": file_path,
                            "line": line_num,
                            "severity": severity,
                            "rule": rule_name,
                            "snippet": line_text.strip()[:120],
                        })
    return issues
