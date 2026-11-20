from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    RABBITMQ_URL: str = "amqp://guest:guest@rabbitmq:5672/"
    GITHUB_CLIENT_ID: str
    GITHUB_CLIENT_SECRET: str
    JWT_SECRET: str
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"

settings = Settings()
