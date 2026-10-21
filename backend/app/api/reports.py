import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import LabReport
from app.schemas.reports import LabReportCreate, LabReportResponse
from app.services.report_service import create_lab_report

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("", response_model=List[LabReportResponse])
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(LabReport).order_by(LabReport.created_at.desc()).all()
    results = []
    for r in reports:
        results.append(LabReportResponse(
            id=r.id,
            experiment_no=r.experiment_no,
            title=r.title,
            category=r.category,
            algorithm_name=r.algorithm_name,
            aim=r.aim,
            description=r.description,
            input_summary=json.loads(r.input_summary or "{}"),
            result_summary=json.loads(r.result_summary or "{}"),
            conclusion=r.conclusion,
            markdown_content=r.markdown_content,
            created_at=r.created_at
        ))
    return results

@router.post("", response_model=LabReportResponse)
def generate_report(payload: LabReportCreate, db: Session = Depends(get_db)):
    report = create_lab_report(
        db=db,
        experiment_no=payload.experiment_no,
        title=payload.title,
        category=payload.category,
        algorithm_name=payload.algorithm_name,
        aim=payload.aim,
        description=payload.description,
        input_summary=payload.input_summary,
        result_summary=payload.result_summary,
        conclusion=payload.conclusion,
        markdown_content=payload.markdown_content
    )
    return LabReportResponse(
        id=report.id,
        experiment_no=report.experiment_no,
        title=report.title,
        category=report.category,
        algorithm_name=report.algorithm_name,
        aim=report.aim,
        description=report.description,
        input_summary=json.loads(report.input_summary or "{}"),
        result_summary=json.loads(report.result_summary or "{}"),
        conclusion=report.conclusion,
        markdown_content=report.markdown_content,
        created_at=report.created_at
    )

@router.get("/{report_id}", response_model=LabReportResponse)
def get_report(report_id: str, db: Session = Depends(get_db)):
    r = db.query(LabReport).filter(LabReport.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Lab report not found")
    return LabReportResponse(
        id=r.id,
        experiment_no=r.experiment_no,
        title=r.title,
        category=r.category,
        algorithm_name=r.algorithm_name,
        aim=r.aim,
        description=r.description,
        input_summary=json.loads(r.input_summary or "{}"),
        result_summary=json.loads(r.result_summary or "{}"),
        conclusion=r.conclusion,
        markdown_content=r.markdown_content,
        created_at=r.created_at
    )

@router.get("/{report_id}/download")
def download_markdown_report(report_id: str, db: Session = Depends(get_db)):
    r = db.query(LabReport).filter(LabReport.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Lab report not found")

    filename = f"lab_report_exp_{r.experiment_no}_{r.algorithm_name.replace(' ', '_').lower()}.md"
    return Response(
        content=r.markdown_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.delete("/{report_id}")
def delete_report(report_id: str, db: Session = Depends(get_db)):
    r = db.query(LabReport).filter(LabReport.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Lab report not found")
    db.delete(r)
    db.commit()
    return {"message": f"Report '{r.title}' deleted successfully"}
