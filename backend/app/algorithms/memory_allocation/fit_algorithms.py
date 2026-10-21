from typing import List
from app.schemas.simulations import (
    MemoryBlockInput,
    MemoryProcessInput,
    MemoryAllocationResponse,
    MemoryBlockState,
    MemoryAllocationStep
)

def simulate_memory_allocation(
    algorithm: str,
    blocks: List[MemoryBlockInput],
    processes: List[MemoryProcessInput]
) -> MemoryAllocationResponse:
    algo_key = algorithm.upper().replace(" ", "_").replace("-", "_")

    # Initialize blocks
    # Each block tracks: block_id, initial_size, current_free_size, allocated_process_id, allocated_process_size, internal_frag
    block_states = [
        MemoryBlockState(
            block_id=b.id,
            initial_size=b.size,
            current_free_size=b.size,
            allocated_process_id=None,
            allocated_process_size=0,
            internal_fragmentation=0
        )
        for b in blocks
    ]

    steps: List[MemoryAllocationStep] = []
    step_num = 1
    allocated_count = 0
    unallocated_count = 0

    for proc in processes:
        chosen_block_idx = None
        reason = ""

        # Find candidate blocks (blocks that are currently free and size >= process size)
        eligible = [
            (idx, b) for idx, b in enumerate(block_states)
            if b.allocated_process_id is None and b.initial_size >= proc.size
        ]

        if not eligible:
            status = "failed"
            reason = f"No available block has sufficient capacity ({proc.size} KB required)."
            unallocated_count += 1
        else:
            if algo_key in ("FIRST_FIT", "FIRSTFIT"):
                chosen_block_idx, chosen_block = eligible[0]
                reason = f"First Fit chose Block {chosen_block.block_id} (size {chosen_block.initial_size} KB), the first free block >= {proc.size} KB."
            elif algo_key in ("BEST_FIT", "BESTFIT"):
                # Minimize remaining space: initial_size - proc.size
                chosen_block_idx, chosen_block = min(
                    eligible,
                    key=lambda item: (item[1].initial_size - proc.size, item[1].block_id)
                )
                rem = chosen_block.initial_size - proc.size
                reason = f"Best Fit chose Block {chosen_block.block_id} (size {chosen_block.initial_size} KB), leaving minimal residue of {rem} KB."
            elif algo_key in ("WORST_FIT", "WORSTFIT"):
                # Maximize remaining space
                chosen_block_idx, chosen_block = max(
                    eligible,
                    key=lambda item: (item[1].initial_size - proc.size, -item[1].block_id)
                )
                rem = chosen_block.initial_size - proc.size
                reason = f"Worst Fit chose Block {chosen_block.block_id} (size {chosen_block.initial_size} KB), leaving maximal residue of {rem} KB."
            else:
                # Default to First Fit
                chosen_block_idx, chosen_block = eligible[0]
                reason = f"First Fit fallback chose Block {chosen_block.block_id}."

            status = "allocated"
            allocated_count += 1

            # Update the chosen block state
            b = block_states[chosen_block_idx]
            b.allocated_process_id = proc.id
            b.allocated_process_size = proc.size
            b.current_free_size = b.initial_size - proc.size
            b.internal_fragmentation = b.initial_size - proc.size

        # Create snapshot step
        snapshot = [b.model_copy() for b in block_states]
        steps.append(MemoryAllocationStep(
            step_number=step_num,
            process_id=proc.id,
            process_size=proc.size,
            selected_block_id=block_states[chosen_block_idx].block_id if chosen_block_idx is not None else None,
            status=status,
            reason=reason,
            blocks_state=snapshot
        ))
        step_num += 1

    total_mem = sum(b.initial_size for b in block_states)
    allocated_mem = sum(b.allocated_process_size for b in block_states)
    internal_frag = sum(b.internal_fragmentation for b in block_states if b.allocated_process_id is not None)
    # External/unused memory in unallocated blocks
    unused_mem = sum(b.initial_size for b in block_states if b.allocated_process_id is None)

    return MemoryAllocationResponse(
        algorithm=algo_key.replace("_", " ").title(),
        blocks_state=block_states,
        allocated_count=allocated_count,
        unallocated_count=unallocated_count,
        total_memory=total_mem,
        allocated_memory=allocated_mem,
        internal_fragmentation=internal_frag,
        external_or_unused_memory=unused_mem,
        steps=steps
    )
