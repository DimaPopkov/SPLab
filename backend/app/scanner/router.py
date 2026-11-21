import httpx
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.auth.models import User
from app.auth.service import get_current_user
from app.scanner.models import ScanReport
from app.scanner.schemas import ScanRequest, ScanResponse
from app.scanner.service import process_scan_job
from app.queue import publish_scan_task

router = APIRouter(prefix="/scanner", tags=["Сканер"])

@router.get("/repos")
async def list_repositories(user: User = Depends(get_current_user)):
    repos_url = "https://" + "api." + "github.com" + "/user/repos?sort=updated&per_page=50"
    async with httpx.AsyncClient(trust_env=False) as client:
        res = await client.get(
            repos_url,
            headers={"Authorization": f"Bearer {user.github_token}"},
        )
    if res.status_code != 200:
        raise HTTPException(status_code=400, detail="Ошибка получения репозиториев GitHub")

    return [
        {"id": r["id"], "full_name": r["full_name"], "private": r["private"], "language": r["language"]}
        for r in res.json()
    ]


async def fallback_background_scan(report_id: int):
    """Запускается в фоне FastAPI, если брокер RabbitMQ временно недоступен."""
    db = SessionLocal()
    try:
        await process_scan_job(report_id, db)
    finally:
        db.close()


@router.post("/scan", response_model=ScanResponse)
async def scan_repository(
    payload: ScanRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = ScanReport(
        user_id=user.id,
        repo_full_name=payload.repo_full_name,
        status="pending",
        stack={},
        stats={},
        issues=[],
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Отправляем задачу в RabbitMQ; если брокер не запущен — обрабатываем в фоне
    queued = await publish_scan_task(report.id)
    if not queued:
        background_tasks.add_task(fallback_background_scan, report.id)

    return report


@router.get("/report/{report_id}", response_model=ScanResponse)
def get_scan_report(
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

@router.get("/profile-summary")
async def get_profile_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reports = (
        db.query(ScanReport)
        .filter(ScanReport.user_id == user.id)
        .order_by(ScanReport.id.desc())
        .limit(20)
        .all()
    )

    history = [
        {
            "id": r.id,
            "repo_full_name": r.repo_full_name,
            "status": r.status,
            "stack": r.stack or {},
            "stats": r.stats or {},
            "issues": r.issues or [],
            "issues_count": len(r.issues or []),
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reports
    ]

    repos_url = "https://" + "api." + "github.com" + "/user/repos?sort=updated&per_page=30"
    popular_repos = []
    async with httpx.AsyncClient(trust_env=False) as client:
        res = await client.get(
            repos_url,
            headers={"Authorization": f"Bearer {user.github_token}"},
        )
        if res.status_code == 200:
            raw_repos = res.json()
            sorted_repos = sorted(
                raw_repos,
                key=lambda x: (x.get("stargazers_count", 0), x.get("updated_at", "")),
                reverse=True,
            )[:6]
            popular_repos = [
                {
                    "id": r["id"],
                    "full_name": r["full_name"],
                    "description": r.get("description") or "Без описания",
                    "language": r.get("language") or "Code",
                    "stars": r.get("stargazers_count", 0),
                    "private": r.get("private", False),
                }
                for r in sorted_repos
            ]

    return {
        "history": history,
        "popular_repos": popular_repos,
    }