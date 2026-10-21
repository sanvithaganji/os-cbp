from typing import List, Dict, Any, Optional
from app.schemas.simulations import BankersRequest, BankersResponse, BankersSafetyStep

def run_bankers_safety_check(
    processes: List[str],
    available: List[int],
    allocation: List[List[int]],
    need: List[List[int]]
) -> tuple[bool, List[str], List[BankersSafetyStep]]:
    n = len(processes)
    m = len(available)
    work = list(available)
    finish = [False] * n
    safe_sequence: List[str] = []
    safety_steps: List[BankersSafetyStep] = []
    step_num = 1

    while len(safe_sequence) < n:
        found = False
        for i in range(n):
            if not finish[i]:
                # Check if Need[i] <= Work
                can_allocate = all(need[i][j] <= work[j] for j in range(m))
                work_before = list(work)

                if can_allocate:
                    # Allocate and release
                    for j in range(m):
                        work[j] += allocation[i][j]
                    finish[i] = True
                    safe_sequence.append(processes[i])
                    found = True

                    safety_steps.append(BankersSafetyStep(
                        step_number=step_num,
                        process=processes[i],
                        work_before=work_before,
                        need=need[i],
                        can_allocate=True,
                        work_after=list(work),
                        description=f"Process {processes[i]} can be allocated resources (Need: {need[i]} <= Work: {work_before}). After release, Work becomes {work}."
                    ))
                    step_num += 1
                    break
                else:
                    # Record evaluation if not already tested in this pass
                    pass

        if not found:
            # Cannot proceed further; system is unsafe
            unfinished = [processes[i] for i in range(n) if not finish[i]]
            safety_steps.append(BankersSafetyStep(
                step_number=step_num,
                process="N/A",
                work_before=list(work),
                need=[],
                can_allocate=False,
                work_after=list(work),
                description=f"Deadlock avoidance condition failed. No remaining process {unfinished} can satisfy Need <= Work ({work}). System is in an UNSAFE state."
            ))
            return False, [], safety_steps

    return True, safe_sequence, safety_steps

def simulate_bankers(request_data: BankersRequest) -> BankersResponse:
    processes = request_data.processes
    m = len(request_data.available)
    n = len(processes)

    # 1. Calculate Need Matrix = Max - Allocation
    need_matrix: List[List[int]] = []
    for i in range(n):
        row = []
        for j in range(m):
            alloc_val = request_data.allocation[i][j] if i < len(request_data.allocation) and j < len(request_data.allocation[i]) else 0
            max_val = request_data.max_demand[i][j] if i < len(request_data.max_demand) and j < len(request_data.max_demand[i]) else 0
            val = max(0, max_val - alloc_val)
            row.append(val)
        need_matrix.append(row)

    # 2. Evaluate Resource Request if provided
    request_eval = None
    curr_available = list(request_data.available)
    curr_allocation = [list(row) for row in request_data.allocation]
    curr_need = [list(row) for row in need_matrix]

    if request_data.resource_request:
        req_p_name = request_data.resource_request.get("process")
        req_vector = request_data.resource_request.get("request", [])

        if req_p_name in processes and len(req_vector) == m:
            p_idx = processes.index(req_p_name)
            # Step 1: Check if Request <= Need
            if any(req_vector[j] > curr_need[p_idx][j] for j in range(m)):
                request_eval = {
                    "process": req_p_name,
                    "request": req_vector,
                    "granted": False,
                    "reason": f"Error: Process {req_p_name} requested more resources {req_vector} than its declared maximum remaining need {curr_need[p_idx]}."
                }
            # Step 2: Check if Request <= Available
            elif any(req_vector[j] > curr_available[j] for j in range(m)):
                request_eval = {
                    "process": req_p_name,
                    "request": req_vector,
                    "granted": False,
                    "reason": f"Wait: Process {req_p_name} requested {req_vector}, but current Available resources {curr_available} are insufficient. Process must wait."
                }
            else:
                # Step 3: Pretend to allocate and check safety
                sim_avail = [curr_available[j] - req_vector[j] for j in range(m)]
                sim_alloc = [list(row) for row in curr_allocation]
                for j in range(m):
                    sim_alloc[p_idx][j] += req_vector[j]
                sim_need = [list(row) for row in curr_need]
                for j in range(m):
                    sim_need[p_idx][j] -= req_vector[j]

                is_safe_after, safe_seq_after, _ = run_bankers_safety_check(
                    processes, sim_avail, sim_alloc, sim_need
                )

                if is_safe_after:
                    request_eval = {
                        "process": req_p_name,
                        "request": req_vector,
                        "granted": True,
                        "safe_sequence_after": safe_seq_after,
                        "reason": f"Safe! Granting request {req_vector} to {req_p_name} leaves the system in a safe state with safe sequence: {' -> '.join(safe_seq_after)}."
                    }
                    # Apply pretend allocation to result state
                    curr_available = sim_avail
                    curr_allocation = sim_alloc
                    curr_need = sim_need
                else:
                    request_eval = {
                        "process": req_p_name,
                        "request": req_vector,
                        "granted": False,
                        "reason": f"Unsafe! Granting request {req_vector} to {req_p_name} would lead to an unsafe state. Request denied to prevent deadlock."
                    }

    # Run safety algorithm on current state
    is_safe, safe_sequence, safety_steps = run_bankers_safety_check(
        processes, curr_available, curr_allocation, curr_need
    )

    return BankersResponse(
        is_safe=is_safe,
        safe_sequence=safe_sequence,
        need_matrix=curr_need,
        safety_steps=safety_steps,
        request_evaluation=request_eval
    )
