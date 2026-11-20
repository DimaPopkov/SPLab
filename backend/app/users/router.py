from fastapi import APIRouter, HTTPException
from app.users.schemas import UserCreate, UserResponse

# Создаём роутер с общим префиксом и тегом для Swagger
router = APIRouter(
    prefix="/users",
    tags=["Пользователи"]
)

# Временная база в памяти для примера
fake_users_db = []

# GET-ручка: получить список пользователей
@router.get("/", response_model=list[UserResponse])
def get_users():
    return fake_users_db

# GET-ручка с параметром: получить одного пользователя по ID
@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int):
    for user in fake_users_db:
        if user["id"] == user_id:
            return user
    raise HTTPException(status_code=404, detail="Пользователь не найден")

# POST-ручка: создать нового пользователя
@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate):
    new_user = {
        "id": len(fake_users_db) + 1,
        "username": user.username,
        "email": user.email,
    }
    fake_users_db.append(new_user)
    return new_user