export interface FileRecord {
  id: string;
  name: string;
  original_name: string;
  folder_id: string | null;
  file_type: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  hash_sha256?: string;
  created_at: string;
  updated_at: string;
}

export interface FolderRecord {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  file_count: number;
  subfolder_count: number;
}

export interface StorageStats {
  total_files: number;
  total_folders: number;
  used_bytes: number;
  quota_bytes: number;
  used_percentage: number;
  available_bytes: number;
}

export interface OverviewStats {
  total_files: number;
  total_folders: number;
  storage_used_bytes: number;
  storage_quota_bytes: number;
  storage_percentage: number;
  total_simulations: number;
  total_processing_jobs: number;
  syllabus_progress: Record<string, boolean>;
  recent_files: {
    id: string;
    name: string;
    file_type: string;
    size_bytes: number;
    created_at: string;
  }[];
  recent_jobs: {
    id: string;
    tool_name: string;
    status: string;
    duration_ms: number;
    created_at: string;
  }[];
  recent_simulations: {
    id: string;
    category: string;
    algorithm_name: string;
    created_at: string;
    execution_time_ms: number;
  }[];
}

// ---------------- CPU Scheduling ----------------
export interface ProcessInput {
  pid: string;
  arrival_time: number;
  burst_time: number;
  priority: number;
}

export interface GanttBlock {
  pid: string;
  start_time: number;
  end_time: number;
  duration: number;
  is_idle: boolean;
}

export interface ProcessResult {
  pid: string;
  arrival_time: number;
  burst_time: number;
  priority: number;
  completion_time: number;
  turnaround_time: number;
  waiting_time: number;
  response_time: number;
}

export interface CpuSimulationStep {
  step_number: number;
  current_time: number;
  running_pid: string | null;
  ready_queue: string[];
  completed_processes: string[];
  description: string;
}

export interface CpuSchedulingResponse {
  algorithm: string;
  gantt_chart: GanttBlock[];
  processes: ProcessResult[];
  avg_turnaround_time: number;
  avg_waiting_time: number;
  avg_response_time: number;
  cpu_utilization: number;
  throughput: number;
  context_switches: number;
  total_time: number;
  steps: CpuSimulationStep[];
}

// ---------------- Memory Allocation ----------------
export interface MemoryBlockInput {
  id: number;
  size: number;
}

export interface MemoryProcessInput {
  id: string;
  size: number;
}

export interface MemoryBlockState {
  block_id: number;
  initial_size: number;
  current_free_size: number;
  allocated_process_id: string | null;
  allocated_process_size: number;
  internal_fragmentation: number;
}

export interface MemoryAllocationStep {
  step_number: number;
  process_id: string;
  process_size: number;
  selected_block_id: number | null;
  status: string;
  reason: string;
  blocks_state: MemoryBlockState[];
}

export interface MemoryAllocationResponse {
  algorithm: string;
  blocks_state: MemoryBlockState[];
  allocated_count: number;
  unallocated_count: number;
  total_memory: number;
  allocated_memory: number;
  internal_fragmentation: number;
  external_or_unused_memory: number;
  steps: MemoryAllocationStep[];
}

// ---------------- File Allocation ----------------
export interface SimulatedDiskBlock {
  block_id: number;
  status: "free" | "data" | "index";
  file_name: string | null;
  next_block_id: number | null;
  index_references: number[] | null;
}

export interface SimulatedFileRecord {
  name: string;
  size_blocks: number;
  start_block?: number;
  allocated_blocks: number[];
  index_block?: number;
  storage_overhead_blocks: number;
  pointer_chain?: { block: number; next: number | string }[];
}

export interface FileAllocationStep {
  step_number: number;
  action: string;
  file_name: string;
  block_id: number | null;
  description: string;
}

export interface FileAllocationResponse {
  strategy: string;
  total_blocks: number;
  free_blocks_count: number;
  occupied_blocks_count: number;
  disk_grid: SimulatedDiskBlock[];
  files: SimulatedFileRecord[];
  external_fragmentation: boolean;
  allocation_success: boolean;
  message: string;
  steps: FileAllocationStep[];
}

// ---------------- Deadlocks ----------------
export interface BankersSafetyStep {
  step_number: number;
  process: string;
  work_before: number[];
  need: number[];
  can_allocate: boolean;
  work_after: number[];
  description: string;
}

export interface BankersResponse {
  is_safe: boolean;
  safe_sequence: string[];
  need_matrix: number[][];
  safety_steps: BankersSafetyStep[];
  request_evaluation?: {
    process: string;
    request: number[];
    granted: boolean;
    safe_sequence_after?: string[];
    reason: string;
  };
}

export interface DeadlockDetectionStep {
  step_number: number;
  process: string;
  work: number[];
  finish: boolean[];
  description: string;
}

export interface DeadlockDetectionResponse {
  is_deadlocked: boolean;
  deadlocked_processes: string[];
  work_history: number[][];
  finish_history: boolean[][];
  steps: DeadlockDetectionStep[];
}

// ---------------- Page Replacement ----------------
export interface PageFrameStep {
  step_number: number;
  page: number;
  frames: (number | null)[];
  is_hit: boolean;
  evicted_page: number | null;
  reason: string;
  future_lookahead?: Record<string, string>;
}

export interface PageReplacementResponse {
  algorithm: string;
  reference_string: number[];
  frames_count: number;
  total_references: number;
  hits: number;
  faults: number;
  hit_ratio: number;
  fault_ratio: number;
  steps: PageFrameStep[];
}

// ---------------- Disk Scheduling ----------------
export interface DiskMovementStep {
  step_number: number;
  from_cylinder: number;
  to_cylinder: number;
  distance: number;
  direction: string;
  serviced_request: number | null;
  is_boundary_jump: boolean;
  description: string;
}

export interface DiskSchedulingResponse {
  algorithm: string;
  initial_head: number;
  cylinder_range: number;
  direction: string;
  service_order: number[];
  head_trajectory: number[];
  total_head_movement: number;
  avg_head_movement: number;
  steps: DiskMovementStep[];
}

// ---------------- Lab Reports ----------------
export interface LabReport {
  id: string;
  experiment_no: number;
  title: string;
  category: string;
  algorithm_name: string;
  aim: string;
  description: string;
  input_summary: Record<string, any>;
  result_summary: Record<string, any>;
  conclusion: string;
  markdown_content: string;
  created_at: string;
}

// ---------------- File Processing ----------------
export interface ProcessingJob {
  id: string;
  tool_name: string;
  status: string;
  input_file_ids: string[];
  output_file_id?: string;
  duration_ms: number;
  details: Record<string, any>;
  error_message?: string;
  created_at: string;
}
