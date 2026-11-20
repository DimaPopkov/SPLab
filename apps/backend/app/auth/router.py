import secrets
import httpx
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.auth.models import User
from app.auth.service import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Авторизация"])

GH_WEB_HOST = "https://github.com"
GH_API_HOST = "https://api.github.com"

@router.get("/github/login")
def github_login():
    state = secrets.token_urlsafe(16)
    auth_path = "/login/oauth/authorize"
    url = (
        f"{GH_WEB_HOST}{auth_path}"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&scope=repo"
        f"&state={state}"
    )
    response = RedirectResponse(url)
    response.set_cookie("oauth_state", state, httponly=True, samesite="lax", max_age=600)
    return response

@router.get("/github/callback")
async def github_callback(
    code: str,
    state: str,
    request: Request,
    db: Session = Depends(get_db)
):
    saved_state = request.cookies.get("oauth_state")
    if not saved_state or saved_state != state:
        raise HTTPException(status_code=400, detail="Ошибка проверки CSRF state")

    token_path = "/login/oauth/access_token"
    user_path = "/user"

    async with httpx.AsyncClient() as client:
        # 1. Меняем code на access_token
        token_res = await client.post(
            f"{GH_WEB_HOST}{token_path}",
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
            },
        )
        token_data = token_res.json()
        gh_token = token_data.get("access_token")
        if not gh_token:
            raise HTTPException(status_code=400, detail="Не удалось получить токен GitHub")

        # 2. Получаем профиль пользователя
        user_res = await client.get(
            f"{GH_API_HOST}{user_path}",
            headers={
                "Authorization": f"Bearer {gh_token}",
                "Accept": "application/vnd.github.v3+json",
            },
        )
        gh_user = user_res.json()

    # 3. Сохраняем или обновляем пользователя в PostgreSQL
    user = db.query(User).filter(User.github_id == gh_user["id"]).first()
    if not user:
        user = User(
            github_id=gh_user["id"],
            username=gh_user["login"],
            avatar_url=gh_user.get("avatar_url"),
            github_token=gh_token,
        )
        db.add(user)
    else:
        user.github_token = gh_token
        user.avatar_url = gh_user.get("avatar_url")

    db.commit()
    db.refresh(user)

    # 4. Ставим безопасную HttpOnly cookie и возвращаем на фронтенд
    jwt_token = create_access_token(user.id)
    response = RedirectResponse(url=settings.FRONTEND_URL)
    response.delete_cookie("oauth_state")
    response.set_cookie(
        key="access_token",
        value=jwt_token,
        httponly=True,
        samesite="lax",
        secure=False,  # Поставить True при переходе на HTTPS
        max_age=7 * 24 * 3600,
    )
    return response

@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {"id": user.id, "username": user.username, "avatar_url": user.avatar_url}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"status": "logged_out"}
