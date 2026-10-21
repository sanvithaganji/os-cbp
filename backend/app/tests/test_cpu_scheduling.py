import pytest
from app.schemas.simulations import ProcessInput
from app.algorithms.cpu_scheduling.fcfs import simulate_fcfs
from app.algorithms.cpu_scheduling.sjf import simulate_sjf
from app.algorithms.cpu_scheduling.round_robin import simulate_round_robin
from app.algorithms.cpu_scheduling.priority import simulate_priority

def test_fcfs_basic_and_invariants():
    procs = [
        ProcessInput(pid="P1", arrival_time=0, burst_time=4, priority=1),
        ProcessInput(pid="P2", arrival_time=1, burst_time=3, priority=1),
        ProcessInput(pid="P3", arrival_time=2, burst_time=1, priority=1),
    ]
    res = simulate_fcfs(procs)
    assert len(res.processes) == 3
    # Check mathematical invariants
    for p in res.processes:
        assert p.turnaround_time == p.completion_time - p.arrival_time
        assert p.waiting_time == p.turnaround_time - p.burst_time
        assert p.waiting_time >= 0

    p1 = next(p for p in res.processes if p.pid == "P1")
    p2 = next(p for p in res.processes if p.pid == "P2")
    p3 = next(p for p in res.processes if p.pid == "P3")
    assert p1.completion_time == 4
    assert p2.completion_time == 7
    assert p3.completion_time == 8

def test_fcfs_idle_cpu():
    procs = [
        ProcessInput(pid="P1", arrival_time=2, burst_time=3, priority=1),
        ProcessInput(pid="P2", arrival_time=7, burst_time=2, priority=1),
    ]
    res = simulate_fcfs(procs)
    idle_blocks = [b for b in res.gantt_chart if b.is_idle]
    assert len(idle_blocks) == 2
    assert idle_blocks[0].start_time == 0 and idle_blocks[0].end_time == 2
    assert idle_blocks[1].start_time == 5 and idle_blocks[1].end_time == 7

def test_sjf_non_preemptive():
    procs = [
        ProcessInput(pid="P1", arrival_time=0, burst_time=7, priority=1),
        ProcessInput(pid="P2", arrival_time=2, burst_time=4, priority=1),
        ProcessInput(pid="P3", arrival_time=4, burst_time=1, priority=1),
        ProcessInput(pid="P4", arrival_time=5, burst_time=4, priority=1),
    ]
    res = simulate_sjf(procs)
    # P1 arrives at 0, finishes at 7
    # At 7, P2 (burst 4), P3 (burst 1), P4 (burst 4) have all arrived.
    # Shortest is P3 (burst 1), runs 7 to 8.
    # Next tie between P2 and P4 (both 4), P2 arrived earlier (2 < 5), so P2 runs 8 to 12.
    # P4 runs 12 to 16.
    p1 = next(p for p in res.processes if p.pid == "P1")
    p3 = next(p for p in res.processes if p.pid == "P3")
    p2 = next(p for p in res.processes if p.pid == "P2")
    p4 = next(p for p in res.processes if p.pid == "P4")

    assert p1.completion_time == 7
    assert p3.completion_time == 8
    assert p2.completion_time == 12
    assert p4.completion_time == 16

    for p in res.processes:
        assert p.turnaround_time == p.completion_time - p.arrival_time
        assert p.waiting_time == p.turnaround_time - p.burst_time

def test_round_robin_quantum():
    procs = [
        ProcessInput(pid="P1", arrival_time=0, burst_time=5, priority=1),
        ProcessInput(pid="P2", arrival_time=1, burst_time=3, priority=1),
        ProcessInput(pid="P3", arrival_time=2, burst_time=1, priority=1),
    ]
    res = simulate_round_robin(procs, time_quantum=2)
    assert res.total_time == 9
    for p in res.processes:
        assert p.turnaround_time == p.completion_time - p.arrival_time
        assert p.waiting_time == p.turnaround_time - p.burst_time

def test_priority_scheduling():
    procs = [
        ProcessInput(pid="P1", arrival_time=0, burst_time=4, priority=3),
        ProcessInput(pid="P2", arrival_time=1, burst_time=3, priority=1),  # higher priority (lower number)
        ProcessInput(pid="P3", arrival_time=2, burst_time=2, priority=2),
    ]
    res = simulate_priority(procs, priority_order="lower_is_higher")
    p1 = next(p for p in res.processes if p.pid == "P1")
    p2 = next(p for p in res.processes if p.pid == "P2")
    p3 = next(p for p in res.processes if p.pid == "P3")
    # P1 runs 0 to 4
    # At 4, both P2 (prio 1) and P3 (prio 2) are available; P2 has higher priority
    # P2 runs 4 to 7
    # P3 runs 7 to 9
    assert p1.completion_time == 4
    assert p2.completion_time == 7
    assert p3.completion_time == 9
