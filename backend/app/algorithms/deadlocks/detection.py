from typing import List
from app.schemas.simulations import DeadlockDetectionRequest, DeadlockDetectionResponse, DeadlockDetectionStep

def simulate_deadlock_detection(request_data: DeadlockDetectionRequest) -> DeadlockDetectionResponse:
    processes = request_data.processes
    n = len(processes)
    m = len(request_data.available)

    work = list(request_data.available)
    allocation = request_data.allocation
    request_matrix = request_data.request_matrix

    # Step 1: Initialize Finish vector
    finish = [False] * n
    for i in range(n):
        # If allocation for process i is all zeros, process does not hold resources, set Finish[i] = True
        if all(allocation[i][j] == 0 for j in range(m)):
            finish[i] = True

    work_history: List[List[int]] = [list(work)]
    finish_history: List[List[bool]] = [list(finish)]
    steps: List[DeadlockDetectionStep] = []
    step_num = 1

    steps.append(DeadlockDetectionStep(
        step_number=step_num,
        process="INIT",
        work=list(work),
        finish=list(finish),
        description=f"Initial state: Work = {work}. Finish initialized based on whether processes hold allocated resources."
    ))
    step_num += 1

    while True:
        found_process = False
        for i in range(n):
            if not finish[i]:
                # Check if Request[i] <= Work
                can_satisfy = all(request_matrix[i][j] <= work[j] for j in range(m))
                if can_satisfy:
                    # Allocate and finish
                    for j in range(m):
                        work[j] += allocation[i][j]
                    finish[i] = True
                    found_process = True

                    work_history.append(list(work))
                    finish_history.append(list(finish))

                    steps.append(DeadlockDetectionStep(
                        step_number=step_num,
                        process=processes[i],
                        work=list(work),
                        finish=list(finish),
                        description=f"Process {processes[i]}'s request {request_matrix[i]} <= Work. Resources granted and reclaimed from Allocation {allocation[i]}. New Work: {work}."
                    ))
                    step_num += 1
                    break

        if not found_process:
            break

    # Check for deadlocked processes
    deadlocked = [processes[i] for i in range(n) if not finish[i]]
    is_deadlocked = len(deadlocked) > 0

    desc = (
        f"Deadlock detected! Processes {deadlocked} are deadlocked and cannot finish."
        if is_deadlocked else
        "No deadlock detected. All processes can successfully complete with available resources."
    )
    steps.append(DeadlockDetectionStep(
        step_number=step_num,
        process="RESULT",
        work=list(work),
        finish=list(finish),
        description=desc
    ))

    return DeadlockDetectionResponse(
        is_deadlocked=is_deadlocked,
        deadlocked_processes=deadlocked,
        work_history=work_history,
        finish_history=finish_history,
        steps=steps
    )
