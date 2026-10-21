import pytest
from app.schemas.simulations import SimulatedFileInput
from app.algorithms.file_allocation.strategies import simulate_file_allocation

def test_contiguous_allocation_and_fragmentation():
    # Pre-occupy every other block: 0, 2, 4, 6...
    existing = [
        {"name": f"f_{i}", "size_blocks": 1, "allocated_blocks": [i * 2], "storage_overhead_blocks": 0}
        for i in range(10)
    ]
    # Total blocks 20, 10 are occupied, 10 are free, but no 2 blocks are consecutive!
    req = SimulatedFileInput(name="large_file", size_blocks=2)
    res = simulate_file_allocation("CONTIGUOUS", total_blocks=20, existing_files=existing, file_to_allocate=req)

    assert not res.allocation_success
    assert res.external_fragmentation is True
    assert "External Fragmentation detected" in res.message

def test_indexed_allocation_with_overhead():
    req = SimulatedFileInput(name="doc.pdf", size_blocks=3)
    res = simulate_file_allocation("INDEXED", total_blocks=32, file_to_allocate=req)
    assert res.allocation_success
    doc = next(f for f in res.files if f.name == "doc.pdf")
    assert doc.storage_overhead_blocks == 1
    assert doc.index_block is not None
    assert len(doc.allocated_blocks) == 3
    # Check that disk grid marks index block
    assert res.disk_grid[doc.index_block].status == "index"

def test_linked_allocation():
    req = SimulatedFileInput(name="data.csv", size_blocks=4)
    res = simulate_file_allocation("LINKED", total_blocks=32, file_to_allocate=req)
    assert res.allocation_success
    doc = next(f for f in res.files if f.name == "data.csv")
    assert len(doc.allocated_blocks) == 4
    # Check pointer chain
    for i in range(3):
        curr_b = doc.allocated_blocks[i]
        next_b = doc.allocated_blocks[i + 1]
        assert res.disk_grid[curr_b].next_block_id == next_b
    assert res.disk_grid[doc.allocated_blocks[-1]].next_block_id == -1
