from pydantic import BaseModel, EmailStr

# То, что присылает фронтенд при создании
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

# То, что возвращаем фронтенду (без пароля!)
class UserResponse(BaseModel):
    id: int
    username: str
    email: str