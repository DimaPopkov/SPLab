import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.models import User
from app.auth.service import get_current_user
from app.scanner.models import ScanReport
from app.scanner.schemas import ScanRequest, ScanResponse
from app.scanner.service import run_security_scan

router = APIRouter(prefix="/scanner", tags=["Сканер"])

@router.get("/repos")
async def list_repositories(user: User = Depends(get_current_user)):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            # Ссылка на GitHub API для получения репозиториев пользователя
            "https://github.com",
            headers={"Authorization": f"Bearer {user.github_token}"},
        )
    if res.status_code != 200:
        raise HTTPException(status_code=400, detail="Ошибка получения репозиториев GitHub")

    return [
        {"id": r["id"], "full_name": r["full_name"], "private": r["private"], "language": r["language"]}
        for r in res.json()
    ]

@router.post("/scan", response_model=ScanResponse)
async def scan_repository(
    payload: ScanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # В будущем: здесь будет публикация задачи в очередь RabbitMQ со статусом "pending"
    found_issues = await run_security_scan(payload.repo_full_name, user.github_token)

    report = ScanReport(
        user_id=user.id,
        repo_full_name=payload.repo_full_name,
        status="completed",
        issues=found_issues,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report