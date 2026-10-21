import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.database.models import LabReport, SimulationRun

def generate_markdown_report(
    experiment_no: int,
    title: str,
    category: str,
    algorithm_name: str,
    aim: str,
    description: str,
    input_summary: Dict[str, Any],
    result_summary: Dict[str, Any],
    conclusion: str,
    timestamp: Optional[datetime] = None
) -> str:
    ts_str = (timestamp or datetime.now(timezone.utc)).strftime("%Y-%m-%d %H:%M:%S UTC")

    md = []
    md.append(f"# Operating Systems Lab Report — Experiment {experiment_no}")
    md.append(f"## {title}")
    md.append(f"**Date & Time of Execution:** {ts_str}  ")
    md.append(f"**Category:** `{category}` | **Algorithm:** `{algorithm_name}`  ")
    md.append("---")
    md.append("### 1. Aim")
    md.append(f"{aim}\n")
    md.append("### 2. Theoretical Overview")
    md.append(f"{description}\n")
    md.append("### 3. Input Parameters & Dataset")
    md.append("```json")
    md.append(json.dumps(input_summary, indent=2))
    md.append("```\n")
    md.append("### 4. Computed Results & Performance Metrics")
    md.append("```json")
    md.append(json.dumps(result_summary, indent=2))
    md.append("```\n")
    md.append("### 5. Conclusion & Observations")
    md.append(f"{conclusion}\n")
    md.append("---")
    md.append("*Generated automatically by MiniOS — File Storage & Processing Lab*")

    return "\n".join(md)

def create_lab_report(
    db: Session,
    experiment_no: int,
    title: str,
    category: str,
    algorithm_name: str,
    aim: str,
    description: str,
    input_summary: Dict[str, Any],
    result_summary: Dict[str, Any],
    conclusion: str,
    markdown_content: Optional[str] = None
) -> LabReport:
    if not markdown_content:
        markdown_content = generate_markdown_report(
            experiment_no=experiment_no,
            title=title,
            category=category,
            algorithm_name=algorithm_name,
            aim=aim,
            description=description,
            input_summary=input_summary,
            result_summary=result_summary,
            conclusion=conclusion
        )

    report = LabReport(
        experiment_no=experiment_no,
        title=title,
        category=category,
        algorithm_name=algorithm_name,
        aim=aim,
        description=description,
        input_summary=json.dumps(input_summary),
        result_summary=json.dumps(result_summary),
        conclusion=conclusion,
        markdown_content=markdown_content,
        created_at=datetime.now(timezone.utc)
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
