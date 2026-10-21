from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import Folder, FileRecord
from app.schemas.folders import FolderCreate, FolderUpdate, FolderResponse
from app.services.storage_service import delete_file_record

router = APIRouter(prefix="/folders", tags=["folders"])

@router.get("", response_model=List[FolderResponse])
def list_folders(
    parent_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Folder)
    if parent_id is not None:
        if parent_id == "root":
            query = query.filter(Folder.parent_id == None)
        else:
            query = query.filter(Folder.parent_id == parent_id)

    folders = query.all()
    results = []
    for f in folders:
        file_count = db.query(FileRecord).filter(FileRecord.folder_id == f.id).count()
        subfolder_count = db.query(Folder).filter(Folder.parent_id == f.id).count()
        results.append(FolderResponse(
            id=f.id,
            name=f.name,
            parent_id=f.parent_id,
            created_at=f.created_at,
            updated_at=f.updated_at,
            file_count=file_count,
            subfolder_count=subfolder_count
        ))
    return results

@router.post("", response_model=FolderResponse)
def create_folder(payload: FolderCreate, db: Session = Depends(get_db)):
    parent = None
    if payload.parent_id and payload.parent_id != "root":
        parent = db.query(Folder).filter(Folder.id == payload.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")

    folder = Folder(
        name=payload.name.strip(),
        parent_id=payload.parent_id if payload.parent_id != "root" else None
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return FolderResponse(
        id=folder.id,
        name=folder.name,
        parent_id=folder.parent_id,
        created_at=folder.created_at,
        updated_at=folder.updated_at,
        file_count=0,
        subfolder_count=0
    )

@router.put("/{folder_id}", response_model=FolderResponse)
def rename_folder(folder_id: str, payload: FolderUpdate, db: Session = Depends(get_db)):
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    if payload.name:
        folder.name = payload.name.strip()
    if payload.parent_id is not None:
        folder.parent_id = None if payload.parent_id == "root" else payload.parent_id

    db.commit()
    db.refresh(folder)
    file_count = db.query(FileRecord).filter(FileRecord.folder_id == folder.id).count()
    subfolder_count = db.query(Folder).filter(Folder.parent_id == folder.id).count()
    return FolderResponse(
        id=folder.id,
        name=folder.name,
        parent_id=folder.parent_id,
        created_at=folder.created_at,
        updated_at=folder.updated_at,
        file_count=file_count,
        subfolder_count=subfolder_count
    )

@router.delete("/{folder_id}")
def delete_folder(folder_id: str, db: Session = Depends(get_db)):
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    # Helper recursive deleter for files and subfolders
    def delete_recursive(f_id: str):
        # Delete subfolders
        subs = db.query(Folder).filter(Folder.parent_id == f_id).all()
        for s in subs:
            delete_recursive(s.id)

        # Delete files in folder
        files = db.query(FileRecord).filter(FileRecord.folder_id == f_id).all()
        for file_rec in files:
            delete_file_record(db, file_rec)

        target = db.query(Folder).filter(Folder.id == f_id).first()
        if target:
            db.delete(target)

    delete_recursive(folder_id)
    db.commit()
    return {"message": f"Folder '{folder.name}' and all contents deleted successfully"}
