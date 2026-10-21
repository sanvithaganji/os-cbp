from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class FileBase(BaseModel):
    name: str

class FileCreateText(BaseModel):
    name: str
    content: str = ""
    folder_id: Optional[str] = None

class FileUpdate(BaseModel):
    name: Optional[str] = None
    folder_id: Optional[str] = None

class FileMoveRequest(BaseModel):
    folder_id: Optional[str] = None

class FileCopyRequest(BaseModel):
    target_folder_id: Optional[str] = None
    new_name: Optional[str] = None

class FileContentUpdateRequest(BaseModel):
    content: str

class FileResponse(BaseModel):
    id: str
    name: str
    original_name: str
    folder_id: Optional[str] = None
    file_type: str
    mime_type: str
    size_bytes: int
    storage_path: str
    hash_sha256: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FileContentResponse(BaseModel):
    id: str
    name: str
    content: str
    size_bytes: int
    file_type: str
    is_text: bool

class StorageStatsResponse(BaseModel):
    total_files: int
    total_folders: int
    used_bytes: int
    quota_bytes: int
    used_percentage: float
    available_bytes: int
