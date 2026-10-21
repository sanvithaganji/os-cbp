from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class FolderBase(BaseModel):
    name: str
    parent_id: Optional[str] = None

class FolderCreate(FolderBase):
    pass

class FolderUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[str] = None

class FolderResponse(FolderBase):
    id: str
    created_at: datetime
    updated_at: datetime
    file_count: int = 0
    subfolder_count: int = 0

    model_config = ConfigDict(from_attributes=True)

class FolderNode(BaseModel):
    id: str
    name: str
    parent_id: Optional[str] = None
    children: List["FolderNode"] = []

FolderNode.model_rebuild()
