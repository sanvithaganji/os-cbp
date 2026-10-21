from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field

# ----------------- CPU Scheduling -----------------
class ProcessInput(BaseModel):
    pid: str
    arrival_time: int = Field(ge=0)
    burst_time: int = Field(gt=0)
    priority: int = 1

class CpuSchedulingRequest(BaseModel):
    algorithm: str  # 'FCFS', 'SJF', 'RR', 'PRIORITY'
    processes: List[ProcessInput]
    time_quantum: Optional[int] = Field(default=2, gt=0)
    priority_order: Optional[str] = "lower_is_higher"  # 'lower_is_higher' or 'higher_is_higher'

class GanttBlock(BaseModel):
    pid: str
    start_time: int
    end_time: int
    duration: int
    is_idle: bool = False

class ProcessResult(BaseModel):
    pid: str
    arrival_time: int
    burst_time: int
    priority: int
    completion_time: int
    turnaround_time: int
    waiting_time: int
    response_time: int

class CpuSimulationStep(BaseModel):
    step_number: int
    current_time: int
    running_pid: Optional[str]
    ready_queue: List[str]
    completed_processes: List[str]
    description: str

class CpuSchedulingResponse(BaseModel):
    algorithm: str
    gantt_chart: List[GanttBlock]
    processes: List[ProcessResult]
    avg_turnaround_time: float
    avg_waiting_time: float
    avg_response_time: float
    cpu_utilization: float
    throughput: float
    context_switches: int
    total_time: int
    steps: List[CpuSimulationStep]

# ----------------- Memory Allocation -----------------
class MemoryBlockInput(BaseModel):
    id: int
    size: int = Field(gt=0)

class MemoryProcessInput(BaseModel):
    id: str
    size: int = Field(gt=0)

class MemoryAllocationRequest(BaseModel):
    algorithm: str  # 'FIRST_FIT', 'BEST_FIT', 'WORST_FIT'
    blocks: List[MemoryBlockInput]
    processes: List[MemoryProcessInput]

class MemoryBlockState(BaseModel):
    block_id: int
    initial_size: int
    current_free_size: int
    allocated_process_id: Optional[str] = None
    allocated_process_size: int = 0
    internal_fragmentation: int = 0

class MemoryAllocationStep(BaseModel):
    step_number: int
    process_id: str
    process_size: int
    selected_block_id: Optional[int]
    status: str  # 'allocated', 'failed'
    reason: str
    blocks_state: List[MemoryBlockState]

class MemoryAllocationResponse(BaseModel):
    algorithm: str
    blocks_state: List[MemoryBlockState]
    allocated_count: int
    unallocated_count: int
    total_memory: int
    allocated_memory: int
    internal_fragmentation: int
    external_or_unused_memory: int
    steps: List[MemoryAllocationStep]

# ----------------- File Allocation -----------------
class SimulatedFileInput(BaseModel):
    name: str
    size_blocks: int = Field(gt=0)

class FileAllocationRequest(BaseModel):
    strategy: str  # 'CONTIGUOUS', 'INDEXED', 'LINKED'
    total_blocks: int = Field(default=64, ge=16, le=256)
    existing_files: Optional[List[Dict[str, Any]]] = None
    file_to_allocate: Optional[SimulatedFileInput] = None
    file_to_delete: Optional[str] = None

class SimulatedDiskBlock(BaseModel):
    block_id: int
    status: str  # 'free', 'data', 'index'
    file_name: Optional[str] = None
    next_block_id: Optional[int] = None  # for linked
    index_references: Optional[List[int]] = None  # for indexed

class SimulatedFileRecord(BaseModel):
    name: str
    size_blocks: int
    start_block: Optional[int] = None
    allocated_blocks: List[int] = []
    index_block: Optional[int] = None  # for indexed
    storage_overhead_blocks: int = 0
    pointer_chain: Optional[List[Dict[str, Any]]] = None

class FileAllocationStep(BaseModel):
    step_number: int
    action: str
    file_name: str
    block_id: Optional[int]
    description: str

class FileAllocationResponse(BaseModel):
    strategy: str
    total_blocks: int
    free_blocks_count: int
    occupied_blocks_count: int
    disk_grid: List[SimulatedDiskBlock]
    files: List[SimulatedFileRecord]
    external_fragmentation: bool = False
    allocation_success: bool = True
    message: str = ""
    steps: List[FileAllocationStep]

# ----------------- Deadlock Management -----------------
class BankersRequest(BaseModel):
    processes: List[str]
    resource_types: List[str]
    available: List[int]
    allocation: List[List[int]]
    max_demand: List[List[int]]
    resource_request: Optional[Dict[str, Any]] = None  # e.g. {"process": "P1", "request": [1, 0, 2]}

class BankersSafetyStep(BaseModel):
    step_number: int
    process: str
    work_before: List[int]
    need: List[int]
    can_allocate: bool
    work_after: List[int]
    description: str

class BankersResponse(BaseModel):
    is_safe: bool
    safe_sequence: List[str]
    need_matrix: List[List[int]]
    safety_steps: List[BankersSafetyStep]
    request_evaluation: Optional[Dict[str, Any]] = None

class DeadlockDetectionRequest(BaseModel):
    processes: List[str]
    resource_types: List[str]
    available: List[int]
    allocation: List[List[int]]
    request_matrix: List[List[int]]

class DeadlockDetectionStep(BaseModel):
    step_number: int
    process: str
    work: List[int]
    finish: List[bool]
    description: str

class DeadlockDetectionResponse(BaseModel):
    is_deadlocked: bool
    deadlocked_processes: List[str]
    work_history: List[List[int]]
    finish_history: List[List[bool]]
    steps: List[DeadlockDetectionStep]

# ----------------- Page Replacement -----------------
class PageReplacementRequest(BaseModel):
    algorithm: str  # 'FIFO', 'OPTIMAL', 'LRU'
    reference_string: List[int]
    frames_count: int = Field(ge=1, le=10)

class PageFrameStep(BaseModel):
    step_number: int
    page: int
    frames: List[Optional[int]]
    is_hit: bool
    evicted_page: Optional[int] = None
    reason: str
    future_lookahead: Optional[Dict[str, Any]] = None

class PageReplacementResponse(BaseModel):
    algorithm: str
    reference_string: List[int]
    frames_count: int
    total_references: int
    hits: int
    faults: int
    hit_ratio: float
    fault_ratio: float
    steps: List[PageFrameStep]

# ----------------- Disk Scheduling -----------------
class DiskSchedulingRequest(BaseModel):
    algorithm: str  # 'SCAN', 'C-SCAN', 'LOOK'
    initial_head: int = Field(ge=0)
    requests: List[int]
    cylinder_range: int = Field(default=200, ge=10)
    direction: str = "right"  # 'left' or 'right'

class DiskMovementStep(BaseModel):
    step_number: int
    from_cylinder: int
    to_cylinder: int
    distance: int
    direction: str
    serviced_request: Optional[int]
    is_boundary_jump: bool = False
    description: str

class DiskSchedulingResponse(BaseModel):
    algorithm: str
    initial_head: int
    cylinder_range: int
    direction: str
    service_order: List[int]
    head_trajectory: List[int]
    total_head_movement: int
    avg_head_movement: float
    steps: List[DiskMovementStep]

# ----------------- General Run / Config -----------------
class SaveConfigInput(BaseModel):
    name: str
    category: str
    algorithm_name: str
    config_data: Dict[str, Any]
    description: Optional[str] = None
