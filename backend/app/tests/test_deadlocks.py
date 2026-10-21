import pytest
from app.schemas.simulations import BankersRequest, DeadlockDetectionRequest
from app.algorithms.deadlocks.bankers import simulate_bankers
from app.algorithms.deadlocks.detection import simulate_deadlock_detection

def test_bankers_safety_and_request():
    req = BankersRequest(
        processes=["P0", "P1", "P2", "P3", "P4"],
        resource_types=["A", "B", "C"],
        available=[3, 3, 2],
        allocation=[
            [0, 1, 0],
            [2, 0, 0],
            [3, 0, 2],
            [2, 1, 1],
            [0, 0, 2]
        ],
        max_demand=[
            [7, 5, 3],
            [3, 2, 2],
            [9, 0, 2],
            [2, 2, 2],
            [4, 3, 3]
        ]
    )
    res = simulate_bankers(req)
    assert res.is_safe is True
    assert len(res.safe_sequence) == 5
    assert res.safe_sequence[0] == "P1"

    # Test an unsafe resource request
    req.resource_request = {"process": "P0", "request": [0, 2, 0]}
    res_req = simulate_bankers(req)
    # P0 requested [0, 2, 0], Need is [7, 4, 3], Available is [3, 3, 2]
    # Check if request eval was performed
    assert res_req.request_evaluation is not None

def test_deadlock_detection():
    # Case with a deadlocked state
    req = DeadlockDetectionRequest(
        processes=["P0", "P1", "P2"],
        resource_types=["R1", "R2"],
        available=[0, 0],
        allocation=[
            [1, 0],
            [0, 1],
            [0, 0]
        ],
        request_matrix=[
            [0, 1],
            [1, 0],
            [0, 0]
        ]
    )
    res = simulate_deadlock_detection(req)
    assert res.is_deadlocked is True
    assert "P0" in res.deadlocked_processes
    assert "P1" in res.deadlocked_processes
    # P2 held nothing and requested nothing, so P2 finished and is not deadlocked
    assert "P2" not in res.deadlocked_processes
