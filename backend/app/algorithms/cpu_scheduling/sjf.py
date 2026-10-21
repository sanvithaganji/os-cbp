from typing import List
from app.schemas.simulations import ProcessInput, CpuSchedulingResponse, GanttBlock, ProcessResult, CpuSimulationStep

def simulate_sjf(processes: List[ProcessInput]) -> CpuSchedulingResponse:
    if not processes:
        return CpuSchedulingResponse(
            algorithm="SJF",
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

    # Copy list of processes
    remaining = [p.model_copy() for p in processes]
    current_time = 0
    gantt_chart: List[GanttBlock] = []
    proc_results: List[ProcessResult] = []
    steps: List[CpuSimulationStep] = []
    context_switches = 0
    busy_time = 0
    completed_pids: List[str] = []
    step_num = 1
    last_pid = None

    while remaining:
        # Available processes at current_time
        available = [p for p in remaining if p.arrival_time <= current_time]

        if not available:
            # CPU is idle until next process arrives
            next_arrival = min(p.arrival_time for p in remaining)
            gantt_chart.append(GanttBlock(
                pid="IDLE",
                start_time=current_time,
                end_time=next_arrival,
                duration=next_arrival - current_time,
                is_idle=True
            ))
            steps.append(CpuSimulationStep(
                step_number=step_num,
                current_time=current_time,
                running_pid="IDLE",
                ready_queue=[],
                completed_processes=list(completed_pids),
                description=f"CPU is idle from t={current_time} to t={next_arrival} waiting for processes to arrive."
            ))
            step_num += 1
            current_time = next_arrival
            last_pid = None
            continue

        # Pick shortest burst time; tie-breaker: arrival time, then pid
        best_proc = min(available, key=lambda p: (p.burst_time, p.arrival_time, p.pid))
        remaining.remove(best_proc)

        if last_pid is not None and last_pid != best_proc.pid:
            context_switches += 1

        start_time = current_time
        response_time = start_time - best_proc.arrival_time
        end_time = start_time + best_proc.burst_time
        busy_time += best_proc.burst_time

        gantt_chart.append(GanttBlock(
            pid=best_proc.pid,
            start_time=start_time,
            end_time=end_time,
            duration=best_proc.burst_time,
            is_idle=False
        ))

        ready_pids = [p.pid for p in remaining if p.arrival_time <= start_time]
        steps.append(CpuSimulationStep(
            step_number=step_num,
            current_time=start_time,
            running_pid=best_proc.pid,
            ready_queue=ready_pids,
            completed_processes=list(completed_pids),
            description=f"Process {best_proc.pid} selected (shortest burst time = {best_proc.burst_time}) and runs from t={start_time} to t={end_time}."
        ))
        step_num += 1

        current_time = end_time
        completed_pids.append(best_proc.pid)
        last_pid = best_proc.pid

        completion_time = end_time
        turnaround_time = completion_time - best_proc.arrival_time
        waiting_time = turnaround_time - best_proc.burst_time

        proc_results.append(ProcessResult(
            pid=best_proc.pid,
            arrival_time=best_proc.arrival_time,
            burst_time=best_proc.burst_time,
            priority=best_proc.priority,
            completion_time=completion_time,
            turnaround_time=turnaround_time,
            waiting_time=waiting_time,
            response_time=response_time
        ))

    steps.append(CpuSimulationStep(
        step_number=step_num,
        current_time=current_time,
        running_pid=None,
        ready_queue=[],
        completed_processes=list(completed_pids),
        description=f"SJF execution finished at t={current_time}."
    ))

    # Maintain original order in proc_results for user comparison
    orig_order_map = {p.pid: idx for idx, p in enumerate(processes)}
    proc_results.sort(key=lambda p: orig_order_map[p.pid])

    total_procs = len(proc_results)
    avg_tat = sum(p.turnaround_time for p in proc_results) / total_procs
    avg_wt = sum(p.waiting_time for p in proc_results) / total_procs
    avg_rt = sum(p.response_time for p in proc_results) / total_procs
    total_time = current_time
    cpu_util = (busy_time / total_time * 100.0) if total_time > 0 else 0.0
    throughput = (total_procs / total_time) if total_time > 0 else 0.0

    return CpuSchedulingResponse(
        algorithm="SJF",
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
