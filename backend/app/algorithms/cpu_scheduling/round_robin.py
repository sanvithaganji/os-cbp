from collections import deque
from typing import List, Dict
from app.schemas.simulations import ProcessInput, CpuSchedulingResponse, GanttBlock, ProcessResult, CpuSimulationStep

def simulate_round_robin(processes: List[ProcessInput], time_quantum: int = 2) -> CpuSchedulingResponse:
    if not processes:
        return CpuSchedulingResponse(
            algorithm=f"Round Robin (Q={time_quantum})",
            gantt_chart=[],
            processes=[],
            avg_turnaround_time=0.0,
            avg_waiting_time=0.0,
            avg_response_time=0.0,
            cpu_utilization=0.0,
            throughput=0.0,
            context_switches=0,
            total_time=0,
            steps=[]
        )

    time_quantum = max(1, time_quantum)
    remaining_burst = {p.pid: p.burst_time for p in processes}
    first_execution_time = {p.pid: None for p in processes}
    completion_times = {p.pid: None for p in processes}
    proc_map = {p.pid: p for p in processes}

    # Track which processes have arrived into the queue
    unvisited = sorted(processes, key=lambda p: (p.arrival_time, p.pid))
    ready_queue: deque[str] = deque()

    current_time = 0
    gantt_chart: List[GanttBlock] = []
    steps: List[CpuSimulationStep] = []
    context_switches = 0
    busy_time = 0
    completed_pids: List[str] = []
    step_num = 1
    last_pid = None

    # Helper to push newly arrived processes up to current_time
    def add_arrived_processes(t: int, exclude_pid: str = None):
        nonlocal unvisited
        newly_arrived = []
        rem_unvisited = []
        for p in unvisited:
            if p.arrival_time <= t and p.pid != exclude_pid:
                newly_arrived.append(p.pid)
            else:
                rem_unvisited.append(p)
        unvisited = rem_unvisited
        for pid in newly_arrived:
            if pid not in ready_queue:
                ready_queue.append(pid)

    add_arrived_processes(current_time)

    while len(completed_pids) < len(processes):
        if not ready_queue:
            if unvisited:
                next_arrival = min(p.arrival_time for p in unvisited)
                idle_duration = next_arrival - current_time
                gantt_chart.append(GanttBlock(
                    pid="IDLE",
                    start_time=current_time,
                    end_time=next_arrival,
                    duration=idle_duration,
                    is_idle=True
                ))
                steps.append(CpuSimulationStep(
                    step_number=step_num,
                    current_time=current_time,
                    running_pid="IDLE",
                    ready_queue=[],
                    completed_processes=list(completed_pids),
                    description=f"CPU idle from t={current_time} to t={next_arrival}."
                ))
                step_num += 1
                current_time = next_arrival
                add_arrived_processes(current_time)
                last_pid = None
                continue
            else:
                break

        curr_pid = ready_queue.popleft()
        burst_left = remaining_burst[curr_pid]
        run_slice = min(burst_left, time_quantum)

        if last_pid is not None and last_pid != curr_pid:
            context_switches += 1

        if first_execution_time[curr_pid] is None:
            first_execution_time[curr_pid] = current_time

        start_time = current_time
        end_time = start_time + run_slice
        busy_time += run_slice
        remaining_burst[curr_pid] -= run_slice

        gantt_chart.append(GanttBlock(
            pid=curr_pid,
            start_time=start_time,
            end_time=end_time,
            duration=run_slice,
            is_idle=False
        ))

        # Check for arrivals strictly up to the end of this time slice
        add_arrived_processes(end_time, exclude_pid=curr_pid)

        # If current process is not finished, re-enqueue
        if remaining_burst[curr_pid] > 0:
            ready_queue.append(curr_pid)
            desc = f"Process {curr_pid} ran from t={start_time} to t={end_time} (slice {run_slice}). Remaining burst: {remaining_burst[curr_pid]}. Re-enqueued."
        else:
            completed_pids.append(curr_pid)
            completion_times[curr_pid] = end_time
            desc = f"Process {curr_pid} completed execution at t={end_time}."

        steps.append(CpuSimulationStep(
            step_number=step_num,
            current_time=start_time,
            running_pid=curr_pid,
            ready_queue=list(ready_queue),
            completed_processes=list(completed_pids),
            description=desc
        ))
        step_num += 1

        current_time = end_time
        last_pid = curr_pid

    steps.append(CpuSimulationStep(
        step_number=step_num,
        current_time=current_time,
        running_pid=None,
        ready_queue=[],
        completed_processes=list(completed_pids),
        description=f"Round Robin scheduling completed at t={current_time}."
    ))

    # Calculate metrics
    proc_results: List[ProcessResult] = []
    for proc in processes:
        ct = completion_times[proc.pid] or current_time
        tat = ct - proc.arrival_time
        wt = tat - proc.burst_time
        rt = (first_execution_time[proc.pid] if first_execution_time[proc.pid] is not None else 0) - proc.arrival_time
        proc_results.append(ProcessResult(
            pid=proc.pid,
            arrival_time=proc.arrival_time,
            burst_time=proc.burst_time,
            priority=proc.priority,
            completion_time=ct,
            turnaround_time=tat,
            waiting_time=wt,
            response_time=rt
        ))

    total_procs = len(proc_results)
    avg_tat = sum(p.turnaround_time for p in proc_results) / total_procs
    avg_wt = sum(p.waiting_time for p in proc_results) / total_procs
    avg_rt = sum(p.response_time for p in proc_results) / total_procs
    total_time = current_time
    cpu_util = (busy_time / total_time * 100.0) if total_time > 0 else 0.0
    throughput = (total_procs / total_time) if total_time > 0 else 0.0

    return CpuSchedulingResponse(
        algorithm=f"Round Robin (Q={time_quantum})",
        gantt_chart=gantt_chart,
        processes=proc_results,
        avg_turnaround_time=round(avg_tat, 2),
        avg_waiting_time=round(avg_wt, 2),
        avg_response_time=round(avg_rt, 2),
        cpu_utilization=round(cpu_util, 2),
        throughput=round(throughput, 4),
        context_switches=context_switches,
        total_time=total_time,
        steps=steps
    )
