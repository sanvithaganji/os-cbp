from typing import List, Optional
from app.schemas.simulations import (
    DiskSchedulingRequest,
    DiskSchedulingResponse,
    DiskMovementStep
)

def simulate_disk_scheduling(request_data: DiskSchedulingRequest) -> DiskSchedulingResponse:
    algo_key = request_data.algorithm.upper().strip()
    head = request_data.initial_head
    reqs = list(set(request_data.requests))  # eliminate duplicate cylinder requests
    cylinder_range = request_data.cylinder_range
    direction = request_data.direction.lower().strip()  # 'left' or 'right'

    max_cylinder = cylinder_range - 1
    min_cylinder = 0

    if not reqs:
        return DiskSchedulingResponse(
            algorithm=algo_key,
            initial_head=head,
            cylinder_range=cylinder_range,
            direction=direction,
            service_order=[],
            head_trajectory=[head],
            total_head_movement=0,
            avg_head_movement=0.0,
            steps=[]
        )

    # Separate requests left and right of head
    left_reqs = sorted([r for r in reqs if r < head])
    right_reqs = sorted([r for r in reqs if r > head])
    at_head = [r for r in reqs if r == head]

    service_order: List[int] = []
    trajectory: List[int] = [head]
    steps: List[DiskMovementStep] = []
    total_movement = 0
    step_num = 1
    current_pos = head

    # If request is already at current head position, service it first
    for r in at_head:
        service_order.append(r)
        steps.append(DiskMovementStep(
            step_number=step_num,
            from_cylinder=current_pos,
            to_cylinder=r,
            distance=0,
            direction=direction,
            serviced_request=r,
            is_boundary_jump=False,
            description=f"Request {r} serviced immediately at head position {current_pos}."
        ))
        step_num += 1

    def move_to(target: int, serviced: Optional[int], is_jump: bool = False, step_dir: str = direction, note: str = ""):
        nonlocal current_pos, total_movement, step_num
        dist = abs(target - current_pos)
        total_movement += dist
        trajectory.append(target)
        if serviced is not None:
            service_order.append(serviced)

        desc = (
            note if note else
            (f"Serviced request at cylinder {serviced}. Moved from {current_pos} to {target} (dist={dist})."
             if serviced is not None else
             f"Moved from {current_pos} to cylinder {target} (dist={dist}).")
        )

        steps.append(DiskMovementStep(
            step_number=step_num,
            from_cylinder=current_pos,
            to_cylinder=target,
            distance=dist,
            direction=step_dir,
            serviced_request=serviced,
            is_boundary_jump=is_jump,
            description=desc
        ))
        step_num += 1
        current_pos = target

    # ==================== SCAN (Elevator) ====================
    if algo_key == "SCAN":
        if direction == "right":
            # Move right servicing all right_reqs
            for r in right_reqs:
                move_to(r, serviced=r, step_dir="right")
            # If there are left requests, must travel to right boundary then reverse
            if left_reqs:
                if current_pos != max_cylinder:
                    move_to(max_cylinder, serviced=None, step_dir="right", note=f"Reached upper disk boundary at cylinder {max_cylinder}. Reversing direction to left.")
                # Reverse and service left_reqs in descending order
                for r in reversed(left_reqs):
                    move_to(r, serviced=r, step_dir="left")
        else:  # left
            # Move left servicing all left_reqs
            for r in reversed(left_reqs):
                move_to(r, serviced=r, step_dir="left")
            # If there are right requests, must travel to left boundary (0) then reverse
            if right_reqs:
                if current_pos != min_cylinder:
                    move_to(min_cylinder, serviced=None, step_dir="left", note=f"Reached lower disk boundary at cylinder {min_cylinder}. Reversing direction to right.")
                # Reverse and service right_reqs in ascending order
                for r in right_reqs:
                    move_to(r, serviced=r, step_dir="right")

    # ==================== C-SCAN (Circular SCAN) ====================
    elif algo_key in ("C-SCAN", "CSCAN"):
        if direction == "right":
            # Service right requests
            for r in right_reqs:
                move_to(r, serviced=r, step_dir="right")
            # If left requests exist, move to max cylinder, jump to min cylinder 0, service left requests
            if left_reqs:
                if current_pos != max_cylinder:
                    move_to(max_cylinder, serviced=None, step_dir="right", note=f"Reached upper boundary {max_cylinder}.")
                # Jump to cylinder 0
                move_to(min_cylinder, serviced=None, is_jump=True, step_dir="jump", note=f"Circular wraparound: Jumped from {current_pos} to cylinder {min_cylinder} without servicing requests.")
                # Continue right servicing left requests
                for r in left_reqs:
                    move_to(r, serviced=r, step_dir="right")
        else:  # left
            for r in reversed(left_reqs):
                move_to(r, serviced=r, step_dir="left")
            if right_reqs:
                if current_pos != min_cylinder:
                    move_to(min_cylinder, serviced=None, step_dir="left", note=f"Reached lower boundary {min_cylinder}.")
                # Jump to max cylinder
                move_to(max_cylinder, serviced=None, is_jump=True, step_dir="jump", note=f"Circular wraparound: Jumped from {current_pos} to cylinder {max_cylinder} without servicing requests.")
                # Continue left servicing right requests in reverse
                for r in reversed(right_reqs):
                    move_to(r, serviced=r, step_dir="left")

    # ==================== LOOK ====================
    elif algo_key == "LOOK":
        if direction == "right":
            # Service right requests
            for r in right_reqs:
                move_to(r, serviced=r, step_dir="right")
            # Reversal without going to the boundary
            if left_reqs:
                for r in reversed(left_reqs):
                    move_to(r, serviced=r, step_dir="left")
        else:  # left
            for r in reversed(left_reqs):
                move_to(r, serviced=r, step_dir="left")
            if right_reqs:
                for r in right_reqs:
                    move_to(r, serviced=r, step_dir="right")

    total_req_count = len(reqs)
    avg_movement = round(total_movement / total_req_count, 2) if total_req_count > 0 else 0.0

    return DiskSchedulingResponse(
        algorithm=algo_key,
        initial_head=head,
        cylinder_range=cylinder_range,
        direction=direction,
        service_order=service_order,
        head_trajectory=trajectory,
        total_head_movement=total_movement,
        avg_head_movement=avg_movement,
        steps=steps
    )
