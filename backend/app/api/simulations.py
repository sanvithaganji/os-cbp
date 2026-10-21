import json
import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import SimulationRun, SavedConfig
from app.schemas.simulations import (
    CpuSchedulingRequest,
    CpuSchedulingResponse,
    MemoryAllocationRequest,
    MemoryAllocationResponse,
    FileAllocationRequest,
    FileAllocationResponse,
    BankersRequest,
    BankersResponse,
    DeadlockDetectionRequest,
    DeadlockDetectionResponse,
    PageReplacementRequest,
    PageReplacementResponse,
    DiskSchedulingRequest,
    DiskSchedulingResponse,
    SaveConfigInput
)
from app.algorithms.cpu_scheduling import (
    simulate_fcfs,
    simulate_sjf,
    simulate_round_robin,
    simulate_priority
)
from app.algorithms.memory_allocation import simulate_memory_allocation
from app.algorithms.file_allocation import simulate_file_allocation
from app.algorithms.deadlocks import simulate_bankers, simulate_deadlock_detection
from app.algorithms.page_replacement import simulate_page_replacement
from app.algorithms.disk_scheduling import simulate_disk_scheduling

router = APIRouter(prefix="/simulations", tags=["simulations"])

def _record_simulation_run(
    db: Session,
    category: str,
    algorithm_name: str,
    input_data: dict,
    result_data: dict,
    steps_data: list,
    duration_ms: float
) -> SimulationRun:
    run = SimulationRun(
        category=category,
        algorithm_name=algorithm_name,
        input_data=json.dumps(input_data),
        result_data=json.dumps(result_data),
        steps_data=json.dumps(steps_data),
        execution_time_ms=round(duration_ms, 2)
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run

# ----------------- CPU Scheduling -----------------
@router.post("/cpu", response_model=CpuSchedulingResponse)
def run_cpu_simulation(payload: CpuSchedulingRequest, db: Session = Depends(get_db)):
    t0 = time.time()
    algo = payload.algorithm.upper().strip()

    if algo == "FCFS":
        res = simulate_fcfs(payload.processes)
    elif algo == "SJF":
        res = simulate_sjf(payload.processes)
    elif algo in ("RR", "ROUND_ROBIN", "ROUND ROBIN"):
        res = simulate_round_robin(payload.processes, time_quantum=payload.time_quantum or 2)
    elif algo in ("PRIORITY", "PRIO"):
        res = simulate_priority(payload.processes, priority_order=payload.priority_order or "lower_is_higher")
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported CPU scheduling algorithm: {algo}")

    dur = (time.time() - t0) * 1000.0
    _record_simulation_run(
        db=db,
        category="cpu_scheduling",
        algorithm_name=algo,
        input_data=payload.model_dump(),
        result_data={
            "avg_turnaround_time": res.avg_turnaround_time,
            "avg_waiting_time": res.avg_waiting_time,
            "avg_response_time": res.avg_response_time,
            "cpu_utilization": res.cpu_utilization,
            "throughput": res.throughput,
            "context_switches": res.context_switches,
            "processes_count": len(res.processes)
        },
        steps_data=[s.model_dump() for s in res.steps],
        duration_ms=dur
    )
    return res

# ----------------- Memory Allocation -----------------
@router.post("/memory", response_model=MemoryAllocationResponse)
def run_memory_simulation(payload: MemoryAllocationRequest, db: Session = Depends(get_db)):
    t0 = time.time()
    res = simulate_memory_allocation(
        algorithm=payload.algorithm,
        blocks=payload.blocks,
        processes=payload.processes
    )
    dur = (time.time() - t0) * 1000.0
    _record_simulation_run(
        db=db,
        category="memory_allocation",
        algorithm_name=payload.algorithm,
        input_data=payload.model_dump(),
        result_data={
            "allocated_count": res.allocated_count,
            "unallocated_count": res.unallocated_count,
            "total_memory": res.total_memory,
            "internal_fragmentation": res.internal_fragmentation,
            "external_or_unused_memory": res.external_or_unused_memory
        },
        steps_data=[s.model_dump() for s in res.steps],
        duration_ms=dur
    )
    return res

# ----------------- File Allocation -----------------
@router.post("/file-allocation", response_model=FileAllocationResponse)
def run_file_allocation_simulation(payload: FileAllocationRequest, db: Session = Depends(get_db)):
    t0 = time.time()
    res = simulate_file_allocation(
        strategy=payload.strategy,
        total_blocks=payload.total_blocks,
        existing_files=payload.existing_files,
        file_to_allocate=payload.file_to_allocate,
        file_to_delete=payload.file_to_delete
    )
    dur = (time.time() - t0) * 1000.0
    _record_simulation_run(
        db=db,
        category="file_allocation",
        algorithm_name=payload.strategy,
        input_data=payload.model_dump(),
        result_data={
            "total_blocks": res.total_blocks,
            "free_blocks_count": res.free_blocks_count,
            "occupied_blocks_count": res.occupied_blocks_count,
            "allocation_success": res.allocation_success,
            "external_fragmentation": res.external_fragmentation
        },
        steps_data=[s.model_dump() for s in res.steps],
        duration_ms=dur
    )
    return res

# ----------------- Deadlock Management -----------------
@router.post("/bankers", response_model=BankersResponse)
def run_bankers_simulation(payload: BankersRequest, db: Session = Depends(get_db)):
    t0 = time.time()
    res = simulate_bankers(payload)
    dur = (time.time() - t0) * 1000.0
    _record_simulation_run(
        db=db,
        category="deadlocks",
        algorithm_name="Bankers Algorithm",
        input_data=payload.model_dump(),
        result_data={
            "is_safe": res.is_safe,
            "safe_sequence": res.safe_sequence,
            "request_evaluation": res.request_evaluation
        },
        steps_data=[s.model_dump() for s in res.safety_steps],
        duration_ms=dur
    )
    return res

@router.post("/deadlock-detection", response_model=DeadlockDetectionResponse)
def run_detection_simulation(payload: DeadlockDetectionRequest, db: Session = Depends(get_db)):
    t0 = time.time()
    res = simulate_deadlock_detection(payload)
    dur = (time.time() - t0) * 1000.0
    _record_simulation_run(
        db=db,
        category="deadlocks",
        algorithm_name="Deadlock Detection",
        input_data=payload.model_dump(),
        result_data={
            "is_deadlocked": res.is_deadlocked,
            "deadlocked_processes": res.deadlocked_processes
        },
        steps_data=[s.model_dump() for s in res.steps],
        duration_ms=dur
    )
    return res

# ----------------- Page Replacement -----------------
@router.post("/page-replacement", response_model=PageReplacementResponse)
def run_page_replacement_simulation(payload: PageReplacementRequest, db: Session = Depends(get_db)):
    t0 = time.time()
    res = simulate_page_replacement(payload)
    dur = (time.time() - t0) * 1000.0
    _record_simulation_run(
        db=db,
        category="page_replacement",
        algorithm_name=payload.algorithm,
        input_data=payload.model_dump(),
        result_data={
            "total_references": res.total_references,
            "hits": res.hits,
            "faults": res.faults,
            "hit_ratio": res.hit_ratio,
            "fault_ratio": res.fault_ratio
        },
        steps_data=[s.model_dump() for s in res.steps],
        duration_ms=dur
    )
    return res

# ----------------- Disk Scheduling -----------------
@router.post("/disk-scheduling", response_model=DiskSchedulingResponse)
def run_disk_scheduling_simulation(payload: DiskSchedulingRequest, db: Session = Depends(get_db)):
    t0 = time.time()
    res = simulate_disk_scheduling(payload)
    dur = (time.time() - t0) * 1000.0
    _record_simulation_run(
        db=db,
        category="disk_scheduling",
        algorithm_name=payload.algorithm,
        input_data=payload.model_dump(),
        result_data={
            "total_head_movement": res.total_head_movement,
            "avg_head_movement": res.avg_head_movement,
            "service_order": res.service_order
        },
        steps_data=[s.model_dump() for s in res.steps],
        duration_ms=dur
    )
    return res

# ----------------- History & Saved Configs -----------------
@router.get("/history")
def get_simulation_history(category: Optional[str] = None, limit: int = 50, db: Session = Depends(get_db)):
    query = db.query(SimulationRun)
    if category:
        query = query.filter(SimulationRun.category == category)
    runs = query.order_by(SimulationRun.created_at.desc()).limit(limit).all()

    return [
        {
            "id": r.id,
            "category": r.category,
            "algorithm_name": r.algorithm_name,
            "input_data": json.loads(r.input_data or "{}"),
            "result_data": json.loads(r.result_data or "{}"),
            "execution_time_ms": r.execution_time_ms,
            "created_at": r.created_at
        }
        for r in runs
    ]

@router.post("/save-config")
def save_config(payload: SaveConfigInput, db: Session = Depends(get_db)):
    cfg = SavedConfig(
        name=payload.name,
        category=payload.category,
        algorithm_name=payload.algorithm_name,
        config_data=json.dumps(payload.config_data),
        description=payload.description
    )
    db.add(cfg)
    db.commit()
    db.refresh(cfg)
    return {"message": "Configuration saved successfully", "id": cfg.id}

@router.get("/configs")
def list_configs(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(SavedConfig)
    if category:
        query = query.filter(SavedConfig.category == category)
    configs = query.order_by(SavedConfig.created_at.desc()).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "category": c.category,
            "algorithm_name": c.algorithm_name,
            "config_data": json.loads(c.config_data or "{}"),
            "description": c.description,
            "created_at": c.created_at
        }
        for c in configs
    ]
