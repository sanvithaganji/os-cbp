import pytest
from app.schemas.simulations import PageReplacementRequest
from app.algorithms.page_replacement.replacement import simulate_page_replacement

def test_page_replacement_algorithms():
    # Standard reference string with 3 frames
    refs = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1]

    # FIFO
    fifo_req = PageReplacementRequest(algorithm="FIFO", reference_string=refs, frames_count=3)
    fifo_res = simulate_page_replacement(fifo_req)
    assert fifo_res.total_references == len(refs)
    assert fifo_res.hits + fifo_res.faults == len(refs)
    assert fifo_res.faults == 15

    # LRU
    lru_req = PageReplacementRequest(algorithm="LRU", reference_string=refs, frames_count=3)
    lru_res = simulate_page_replacement(lru_req)
    assert lru_res.hits + lru_res.faults == len(refs)
    assert lru_res.faults == 12

    # Optimal
    opt_req = PageReplacementRequest(algorithm="OPTIMAL", reference_string=refs, frames_count=3)
    opt_res = simulate_page_replacement(opt_req)
    assert opt_res.hits + opt_res.faults == len(refs)
    assert opt_res.faults == 9
    assert opt_res.faults <= fifo_res.faults
    assert opt_res.faults <= lru_res.faults
