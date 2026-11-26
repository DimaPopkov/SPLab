from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    GITHUB_CLIENT_ID: str
    GITHUB_CLIENT_SECRET: str
    JWT_SECRET: str
    FRONTEND_URL: str = "http://localhost:5173"
    RABBITMQ_URL: str = "amqp://guest:guest@localhost:5672/"
    TOKEN_ENCRYPTION_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()