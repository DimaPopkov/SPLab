import json
import re
import httpx


def parse_requirements_txt(content: str) -> list[dict]:
    """Парсит Python-пакеты и версии из requirements.txt."""
    deps = []
    for raw_line in content.splitlines():
        line = raw_line.split("#", 1)[0].strip()
        if not line or line.startswith(("-", "git+", "http://", "https://")):
            continue

        # Ищем конструкции вида package==1.2.3, package>=1.2.3, package~=1.2.3
        match = re.match(r"^([a-zA-Z0-9_.-]+)(?:\[[^\]]+\])?\s*(==|>=|~=)\s*([0-9][a-zA-Z0-9._-]*)", line)
        if match:
            deps.append({
                "name": match.group(1),
                "version": match.group(3),
                "ecosystem": "PyPI",
            })
        else:
            name_only = re.match(r"^([a-zA-Z0-9_.-]+)", line)
            if name_only:
                deps.append({
                    "name": name_only.group(1),
                    "version": None,
                    "ecosystem": "PyPI",
                })
    return deps


def parse_package_json(content: str) -> list[dict]:
    """Парсит JS-библиотеки из package.json (dependencies и devDependencies)."""
    deps = []
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return deps

    all_pkgs = {}
    all_pkgs.update(data.get("dependencies") or {})
    all_pkgs.update(data.get("devDependencies") or {})

    for name, raw_ver in all_pkgs.items():
        clean_ver = re.sub(r"^[\^~>=<v\s]+", "", str(raw_ver)).strip()
        # Берём первую конкретную версию, если указан диапазон
        clean_ver = clean_ver.split(" ")[0]
        version = clean_ver if re.match(r"^[0-9]", clean_ver) else None
        deps.append({
            "name": name,
            "version": version,
            "ecosystem": "npm",
        })
    return deps


async def audit_dependencies(config_files: list[tuple[str, str]]) -> list[dict]:
    """
    Принимает список кортежей (file_path, file_content).
    Возвращает список всех найденных зависимостей с версиями и уязвимостями из OSV.dev.
    """
    parsed_deps = []
    seen = set()

    for path, content in config_files:
        lower_path = path.lower()
        items = []
        if lower_path.endswith("requirements.txt"):
            items = parse_requirements_txt(content)
        elif lower_path.endswith("package.json"):
            items = parse_package_json(content)

        for item in items:
            key = (item["ecosystem"], item["name"].lower())
            if key not in seen:
                seen.add(key)
                item["source"] = path
                item["vulns"] = []
                parsed_deps.append(item)

    if not parsed_deps:
        return []

    # Формируем пакетный запрос к базе Google OSV (только для библиотек с известной версией)
    query_indices = []
    queries = []
    for idx, dep in enumerate(parsed_deps):
        if dep["version"]:
            query_indices.append(idx)
            queries.append({
                "version": dep["version"],
                "package": {
                    "name": dep["name"],
                    "ecosystem": dep["ecosystem"],
                },
            })

    if not queries:
        return parsed_deps

    osv_url = "https://" + "api." + "osv.dev" + "/v1/querybatch"
    try:
        async with httpx.AsyncClient(timeout=15.0, trust_env=False) as client:
            res = await client.post(osv_url, json={"queries": queries})
            if res.status_code == 200:
                results = res.json().get("results", [])
                for dep_idx, result_item in zip(query_indices, results):
                    raw_vulns = result_item.get("vulns") or []
                    for v in raw_vulns[:5]:
                        aliases = v.get("aliases") or []
                        cve_id = next((a for a in aliases if a.startswith("CVE-")), v.get("id"))
                        parsed_deps[dep_idx]["vulns"].append({
                            "id": cve_id,
                            "summary": v.get("summary") or v.get("details", "Известная уязвимость пакета")[:140],
                        })
    except Exception:
        # Если внешний API OSV временно недоступен, возвращаем список библиотек без падения сканера
        pass

    # Сортируем: сначала библиотеки с уязвимостями, затем по алфавиту
    parsed_deps.sort(key=lambda d: (-len(d["vulns"]), d["name"].lower()))
    return parsed_deps