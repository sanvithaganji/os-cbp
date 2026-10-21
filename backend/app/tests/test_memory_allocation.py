import pytest
from app.schemas.simulations import MemoryBlockInput, MemoryProcessInput
from app.algorithms.memory_allocation.fit_algorithms import simulate_memory_allocation

def test_memory_allocation_first_best_worst():
    blocks = [
        MemoryBlockInput(id=1, size=100),
        MemoryBlockInput(id=2, size=500),
        MemoryBlockInput(id=3, size=200),
        MemoryBlockInput(id=4, size=300),
        MemoryBlockInput(id=5, size=600),
    ]
    processes = [
        MemoryProcessInput(id="P1", size=212),
        MemoryProcessInput(id="P2", size=417),
        MemoryProcessInput(id="P3", size=112),
        MemoryProcessInput(id="P4", size=426),
    ]

    # Test First Fit
    ff = simulate_memory_allocation("FIRST_FIT", blocks, processes)
    assert ff.allocated_count >= 1
    # Check that block 1 (size 100) was not assigned to P1 (212)
    p1_step = next(s for s in ff.steps if s.process_id == "P1")
    assert p1_step.selected_block_id == 2  # first block >= 212 is Block 2 (500)

    # Test Best Fit
    bf = simulate_memory_allocation("BEST_FIT", blocks, processes)
    p1_step_bf = next(s for s in bf.steps if s.process_id == "P1")
    assert p1_step_bf.selected_block_id == 4  # Block 4 (size 300) leaves residue 88 vs 500 (288) or 600 (388)

    # Test Worst Fit
    wf = simulate_memory_allocation("WORST_FIT", blocks, processes)
    p1_step_wf = next(s for s in wf.steps if s.process_id == "P1")
    assert p1_step_wf.selected_block_id == 5  # Block 5 (size 600) leaves maximal residue 388

def test_memory_allocation_failure():
    blocks = [MemoryBlockInput(id=1, size=50)]
    processes = [MemoryProcessInput(id="P1", size=100)]
    res = simulate_memory_allocation("FIRST_FIT", blocks, processes)
    assert res.allocated_count == 0
    assert res.unallocated_count == 1
    assert res.steps[0].status == "failed"
