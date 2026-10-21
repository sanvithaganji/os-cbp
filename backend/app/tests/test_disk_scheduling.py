import pytest
from app.schemas.simulations import DiskSchedulingRequest
from app.algorithms.disk_scheduling.disk_algorithms import simulate_disk_scheduling

def test_disk_scheduling_scan_and_look():
    # Requests: 98, 183, 37, 122, 14, 124, 65, 67
    # Initial head: 53, Cylinder range: 200 (0-199), Direction: right
    reqs = [98, 183, 37, 122, 14, 124, 65, 67]

    # SCAN (right):
    # Head moves right: 53 -> 65 -> 67 -> 98 -> 122 -> 124 -> 183 -> 199 (boundary)
    # Then reverses left: 199 -> 37 -> 14.
    # Total distance: (199 - 53) + (199 - 14) = 146 + 185 = 331 cylinders.
    scan_req = DiskSchedulingRequest(
        algorithm="SCAN",
        initial_head=53,
        requests=reqs,
        cylinder_range=200,
        direction="right"
    )
    scan_res = simulate_disk_scheduling(scan_req)
    assert scan_res.total_head_movement == 331
    assert len(scan_res.service_order) == len(reqs)

    # LOOK (right):
    # Head moves right: 53 -> 65 -> 67 -> 98 -> 122 -> 124 -> 183
    # Then reverses left directly from 183 to 37 -> 14 (does NOT touch 199).
    # Total distance: (183 - 53) + (183 - 14) = 130 + 169 = 299 cylinders.
    look_req = DiskSchedulingRequest(
        algorithm="LOOK",
        initial_head=53,
        requests=reqs,
        cylinder_range=200,
        direction="right"
    )
    look_res = simulate_disk_scheduling(look_req)
    assert look_res.total_head_movement == 299
    assert len(look_res.service_order) == len(reqs)

def test_c_scan():
    # C-SCAN (right):
    # 53 -> right to 183 -> 199 boundary -> jumps to 0 -> right to 37
    c_scan_req = DiskSchedulingRequest(
        algorithm="C-SCAN",
        initial_head=53,
        requests=[98, 183, 37, 122, 14, 124, 65, 67],
        cylinder_range=200,
        direction="right"
    )
    c_scan_res = simulate_disk_scheduling(c_scan_req)
    assert len(c_scan_res.service_order) == 8
    # Boundary jump should be recorded
    jump_steps = [s for s in c_scan_res.steps if s.is_boundary_jump]
    assert len(jump_steps) == 1
    assert jump_steps[0].from_cylinder == 199
    assert jump_steps[0].to_cylinder == 0
