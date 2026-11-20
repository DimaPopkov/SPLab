import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.models import User
from app.auth.service import get_current_user
from app.scanner.models import ScanReport
from app.scanner.schemas import ScanRequest, ScanResponse
from app.rabbitmq import publish_scan_task

router = APIRouter(prefix="/scanner", tags=["Сканер"])

@router.get("/repos")
async def list_repositories(user: User = Depends(get_current_user)):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://github.com",
            headers={
                "Authorization": f"Bearer {user.github_token}",
                "Accept": "application/vnd.github.v3+json",
            },
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
    report = ScanReport(
        user_id=user.id,
        repo_full_name=payload.repo_full_name,
        status="pending",
        issues=[],
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    try:
        await publish_scan_task(report.id)
    except Exception as exc:
        report.status = "failed"
        db.commit()
        raise HTTPException(status_code=503, detail=f"Не удалось поставить задачу в очередь: {exc}")

    return report

@router.get("/reports/{report_id}", response_model=ScanResponse)
async def get_scan_report(
    report_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = (
        db.query(ScanReport)
        .filter(ScanReport.id == report_id, ScanReport.user_id == user.id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Отчёт не найден")
    return report
