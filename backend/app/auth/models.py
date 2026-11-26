from cryptography.fernet import Fernet
from sqlalchemy import Column, Integer, String
from sqlalchemy.types import TypeDecorator
from app.database import Base
from app.config import settings

fernet = Fernet(settings.TOKEN_ENCRYPTION_KEY.strip().encode())

class EncryptedString(TypeDecorator):
    """Автоматически шифрует строку при записи в БД и расшифровывает при чтении."""
    impl = String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return fernet.encrypt(value.encode("utf-8")).decode("utf-8")
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return fernet.decrypt(value.encode("utf-8")).decode("utf-8")
        return value

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    github_id = Column(Integer, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    avatar_url = Column(String, nullable=True)
    github_token = Column(EncryptedString, nullable=False)