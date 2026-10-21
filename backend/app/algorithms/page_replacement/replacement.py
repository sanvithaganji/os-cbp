from collections import deque
from typing import List, Optional, Dict, Any
from app.schemas.simulations import (
    PageReplacementRequest,
    PageReplacementResponse,
    PageFrameStep
)

def simulate_page_replacement(request_data: PageReplacementRequest) -> PageReplacementResponse:
    algo_key = request_data.algorithm.upper().strip()
    refs = request_data.reference_string
    num_frames = request_data.frames_count

    if not refs:
        return PageReplacementResponse(
            algorithm=algo_key,
            reference_string=[],
            frames_count=num_frames,
            total_references=0,
            hits=0,
            faults=0,
            hit_ratio=0.0,
            fault_ratio=0.0,
            steps=[]
        )

    frames: List[Optional[int]] = [None] * num_frames
    hits = 0
    faults = 0
    steps: List[PageFrameStep] = []

    # FIFO tracking: queue of pages or indices
    fifo_queue: deque[int] = deque()

    # LRU tracking: map of page -> last access time index
    last_used: Dict[int, int] = {}

    for idx, page in enumerate(refs):
        step_num = idx + 1
        evicted_page = None
        lookahead_info = None

        if page in frames:
            # Hit!
            hits += 1
            is_hit = True
            last_used[page] = idx
            reason = f"Page {page} is already in frame {frames.index(page)}. (Hit)"
        else:
            # Fault!
            faults += 1
            is_hit = False

            # Check if there is an empty frame
            if None in frames:
                empty_idx = frames.index(None)
                frames[empty_idx] = page
                fifo_queue.append(page)
                last_used[page] = idx
                reason = f"Page fault: Placed page {page} into empty frame {empty_idx}."
            else:
                # Need to evict a page
                if algo_key == "FIFO":
                    evicted_page = fifo_queue.popleft()
                    evict_idx = frames.index(evicted_page)
                    frames[evict_idx] = page
                    fifo_queue.append(page)
                    last_used[page] = idx
                    reason = f"Page fault (FIFO): Evicted oldest loaded page {evicted_page} from frame {evict_idx} and replaced with {page}."

                elif algo_key == "LRU":
                    # Evict the page in frames with the minimum last_used timestamp
                    evicted_page = min(frames, key=lambda p: last_used.get(p, -1))
                    evict_idx = frames.index(evicted_page)
                    frames[evict_idx] = page
                    last_used[page] = idx
                    reason = f"Page fault (LRU): Evicted least recently accessed page {evicted_page} (last used at step {last_used[evicted_page] + 1}) from frame {evict_idx}."

                elif algo_key in ("OPTIMAL", "OPT"):
                    # Look ahead into future references: idx + 1 to len(refs)
                    future_refs = refs[idx + 1:]
                    next_usage = {}
                    for p in frames:
                        if p in future_refs:
                            next_usage[p] = future_refs.index(p) + idx + 1
                        else:
                            next_usage[p] = float("inf")  # Never used again

                    # Evict page with maximal next_usage distance
                    evicted_page = max(frames, key=lambda p: next_usage[p])
                    evict_idx = frames.index(evicted_page)

                    lookahead_info = {
                        str(p): ("Never" if next_usage[p] == float("inf") else f"Step {next_usage[p] + 1}")
                        for p in frames
                    }
                    dist_text = "never again" if next_usage[evicted_page] == float("inf") else f"farthest at step {next_usage[evicted_page] + 1}"
                    reason = f"Page fault (Optimal): Evicted page {evicted_page} (needed {dist_text}) from frame {evict_idx}."

                    # Now perform replacement
                    frames[evict_idx] = page
                    last_used[page] = idx

                else:
                    # Fallback to FIFO
                    evicted_page = fifo_queue.popleft()
                    evict_idx = frames.index(evicted_page)
                    frames[evict_idx] = page
                    fifo_queue.append(page)
                    reason = f"Page fault: Evicted page {evicted_page}."

        steps.append(PageFrameStep(
            step_number=step_num,
            page=page,
            frames=list(frames),
            is_hit=is_hit,
            evicted_page=evicted_page,
            reason=reason,
            future_lookahead=lookahead_info
        ))

    total = len(refs)
    hit_ratio = round(hits / total, 4) if total > 0 else 0.0
    fault_ratio = round(faults / total, 4) if total > 0 else 0.0

    return PageReplacementResponse(
        algorithm=algo_key,
        reference_string=refs,
        frames_count=num_frames,
        total_references=total,
        hits=hits,
        faults=faults,
        hit_ratio=hit_ratio,
        fault_ratio=fault_ratio,
        steps=steps
    )
