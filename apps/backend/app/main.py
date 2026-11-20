from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.auth.router import router as auth_router
from app.scanner.router import router as scanner_router
from app.router import router as ping_router

# Импортируем модели для автосоздания таблиц в PostgreSQL
from app.auth import models as auth_models
from app.scanner import models as scanner_models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SecScan API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://127.0.0.1:5173"],
    allow_credentials=True,  # Обязательно для передачи HttpOnly cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(scanner_router, prefix="/api")
app.include_router(ping_router, prefix="/api")