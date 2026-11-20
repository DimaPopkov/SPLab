from fastapi import APIRouter

router = APIRouter(prefix="/ping", tags=["Пинг"])

@router.get("")
def ping():
    return {"status": "ok", "message": "Всё ок! Сервер на связи."}