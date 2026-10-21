from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOADS_DIR = STORAGE_DIR / "uploads"
PROCESSED_DIR = STORAGE_DIR / "processed"
REPORTS_DIR = BASE_DIR / "reports"

# Ensure runtime directories exist
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    BASE_DIR: Path = BASE_DIR
    STORAGE_DIR: Path = STORAGE_DIR
    UPLOADS_DIR: Path = UPLOADS_DIR
    PROCESSED_DIR: Path = PROCESSED_DIR
    REPORTS_DIR: Path = REPORTS_DIR

    PROJECT_NAME: str = "MiniOS — File Storage & Processing Lab"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'minios.db'}"
    
    # Simulated Storage Quota (default: 50MB)
    DEFAULT_STORAGE_QUOTA_BYTES: int = 50 * 1024 * 1024  # 50 MB
    MAX_FILE_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB max upload
    
    # Disk simulation defaults
    DEFAULT_DISK_CYLINDERS: int = 200
    DEFAULT_DISK_BLOCKS: int = 64
    
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "*"
    ]

    model_config = {
        "case_sensitive": True
    }

settings = Settings()
