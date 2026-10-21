from typing import List
from app.schemas.simulations import ProcessInput, CpuSchedulingResponse, GanttBlock, ProcessResult, CpuSimulationStep

def simulate_fcfs(processes: List[ProcessInput]) -> CpuSchedulingResponse:
    if not processes:
        return CpuSchedulingResponse(
            algorithm="FCFS",
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

    # Sort by arrival time, tie-breaker: original order
    sorted_procs = sorted(processes, key=lambda p: p.arrival_time)
    
    current_time = 0
    gantt_chart: List[GanttBlock] = []
    proc_results: List[ProcessResult] = []
    steps: List[CpuSimulationStep] = []
    context_switches = 0
    busy_time = 0
    completed_pids: List[str] = []
    step_num = 1

    last_pid = None

    for proc in sorted_procs:
        # Check if CPU is idle
        if current_time < proc.arrival_time:
            idle_duration = proc.arrival_time - current_time
            gantt_chart.append(GanttBlock(
                pid="IDLE",
                start_time=current_time,
                end_time=proc.arrival_time,
                duration=idle_duration,
                is_idle=True
            ))
            steps.append(CpuSimulationStep(
                step_number=step_num,
                current_time=current_time,
                running_pid="IDLE",
                ready_queue=[p.pid for p in sorted_procs if p.arrival_time <= current_time and p.pid not in completed_pids],
                completed_processes=list(completed_pids),
                description=f"CPU is idle from t={current_time} to t={proc.arrival_time} waiting for incoming processes."
            ))
            step_num += 1
            current_time = proc.arrival_time
            last_pid = None

        if last_pid is not None and last_pid != proc.pid:
            context_switches += 1

        start_time = current_time
        response_time = start_time - proc.arrival_time
        end_time = start_time + proc.burst_time
        busy_time += proc.burst_time

        gantt_chart.append(GanttBlock(
            pid=proc.pid,
            start_time=start_time,
            end_time=end_time,
            duration=proc.burst_time,
            is_idle=False
        ))

        steps.append(CpuSimulationStep(
            step_number=step_num,
            current_time=start_time,
            running_pid=proc.pid,
            ready_queue=[p.pid for p in sorted_procs if p.arrival_time <= start_time and p.pid not in completed_pids and p.pid != proc.pid],
            completed_processes=list(completed_pids),
            description=f"Process {proc.pid} starts execution at t={start_time} for burst {proc.burst_time}."
        ))
        step_num += 1

        current_time = end_time
        completed_pids.append(proc.pid)
        last_pid = proc.pid

        completion_time = end_time
        turnaround_time = completion_time - proc.arrival_time
        waiting_time = turnaround_time - proc.burst_time

        proc_results.append(ProcessResult(
            pid=proc.pid,
            arrival_time=proc.arrival_time,
            burst_time=proc.burst_time,
            priority=proc.priority,
            completion_time=completion_time,
            turnaround_time=turnaround_time,
            waiting_time=waiting_time,
            response_time=response_time
        ))

    # Final completion step
    steps.append(CpuSimulationStep(
        step_number=step_num,
        current_time=current_time,
        running_pid=None,
        ready_queue=[],
        completed_processes=list(completed_pids),
        description=f"All processes completed execution at t={current_time}."
    ))

    total_procs = len(proc_results)
    avg_tat = sum(p.turnaround_time for p in proc_results) / total_procs
    avg_wt = sum(p.waiting_time for p in proc_results) / total_procs
    avg_rt = sum(p.response_time for p in proc_results) / total_procs
    total_time = current_time
    cpu_util = (busy_time / total_time * 100.0) if total_time > 0 else 0.0
    throughput = (total_procs / total_time) if total_time > 0 else 0.0

    return CpuSchedulingResponse(
        algorithm="FCFS",
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
