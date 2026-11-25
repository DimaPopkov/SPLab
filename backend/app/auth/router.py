import secrets
import httpx
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.auth.models import User
from app.auth.service import create_access_token, get_current_user
from urllib.parse import quote

router = APIRouter(prefix="/auth", tags=["Авторизация"])

@router.get("/github/login")
def github_login():
    state = secrets.token_urlsafe(16)
    url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID.strip()}"
        "&scope=repo"
        f"&state={state}"
    )

    response = RedirectResponse(url)
    response.set_cookie(
        "oauth_state",
        state,
        httponly=True,
        samesite="none",
        secure=True,
        max_age=600,
    )
    
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

    token_url = "https://" + "github.com" + "/login/oauth/access_token"
    user_url = "https://" + "api.github.com" + "/user"

    async with httpx.AsyncClient(trust_env=False) as client:
        token_res = await client.post(
            token_url,
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

        user_res = await client.get(
            user_url,
            headers={"Authorization": f"Bearer {gh_token}"},
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
        samesite="none",
        secure=True,
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