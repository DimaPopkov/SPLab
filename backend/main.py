from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.users.router import router as users_router

app = FastAPI(title="Project API")

# Разрешаем запросы с фронтенда (Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router, prefix="/api")

class Message(BaseModel):
    text: str

@app.get("/api/ping")
def ping():
    return {"status": "ok", "message": "Связь с FastAPI установлена!"}

@app.post("/api/echo")
def echo(msg: Message):
    return {"reply": f"Сервер получил: {msg.text}"}