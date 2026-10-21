from typing import List, Dict, Any, Optional
from app.schemas.simulations import (
    SimulatedFileInput,
    FileAllocationResponse,
    SimulatedDiskBlock,
    SimulatedFileRecord,
    FileAllocationStep
)

def simulate_file_allocation(
    strategy: str,
    total_blocks: int = 64,
    existing_files: Optional[List[Dict[str, Any]]] = None,
    file_to_allocate: Optional[SimulatedFileInput] = None,
    file_to_delete: Optional[str] = None
) -> FileAllocationResponse:
    strat_key = strategy.upper().strip()

    # Reconstruct disk blocks from existing files
    disk_grid: List[SimulatedDiskBlock] = [
        SimulatedDiskBlock(block_id=i, status="free") for i in range(total_blocks)
    ]
    files: List[SimulatedFileRecord] = []
    steps: List[FileAllocationStep] = []
    step_num = 1

    # Load existing files if any
    if existing_files:
        for f in existing_files:
            file_rec = SimulatedFileRecord(
                name=f.get("name", "file"),
                size_blocks=f.get("size_blocks", 1),
                start_block=f.get("start_block"),
                allocated_blocks=f.get("allocated_blocks", []),
                index_block=f.get("index_block"),
                storage_overhead_blocks=f.get("storage_overhead_blocks", 0),
                pointer_chain=f.get("pointer_chain")
            )
            files.append(file_rec)

            # Mark disk grid blocks
            if file_rec.index_block is not None and file_rec.index_block < total_blocks:
                disk_grid[file_rec.index_block] = SimulatedDiskBlock(
                    block_id=file_rec.index_block,
                    status="index",
                    file_name=file_rec.name,
                    index_references=file_rec.allocated_blocks
                )

            for idx, b_id in enumerate(file_rec.allocated_blocks):
                if b_id < total_blocks:
                    next_ptr = file_rec.allocated_blocks[idx + 1] if idx + 1 < len(file_rec.allocated_blocks) else -1
                    disk_grid[b_id] = SimulatedDiskBlock(
                        block_id=b_id,
                        status="data",
                        file_name=file_rec.name,
                        next_block_id=next_ptr if strat_key == "LINKED" else None
                    )

    # 1. Handle file deletion if requested
    if file_to_delete:
        target_f = next((f for f in files if f.name == file_to_delete), None)
        if target_f:
            steps.append(FileAllocationStep(
                step_number=step_num,
                action="delete",
                file_name=target_f.name,
                block_id=None,
                description=f"Releasing blocks for file '{target_f.name}'..."
            ))
            step_num += 1

            # Free index block
            if target_f.index_block is not None and target_f.index_block < total_blocks:
                disk_grid[target_f.index_block] = SimulatedDiskBlock(block_id=target_f.index_block, status="free")
            # Free data blocks
            for b_id in target_f.allocated_blocks:
                if b_id < total_blocks:
                    disk_grid[b_id] = SimulatedDiskBlock(block_id=b_id, status="free")

            files = [f for f in files if f.name != file_to_delete]
            steps.append(FileAllocationStep(
                step_number=step_num,
                action="delete_complete",
                file_name=file_to_delete,
                block_id=None,
                description=f"File '{file_to_delete}' deleted. {len(target_f.allocated_blocks) + (1 if target_f.index_block is not None else 0)} blocks reclaimed to free list."
            ))
            step_num += 1

    allocation_success = True
    external_fragmentation = False
    message = ""

    # 2. Handle file allocation if requested
    if file_to_allocate:
        req_name = file_to_allocate.name
        req_size = file_to_allocate.size_blocks

        # Check if file name already exists
        if any(f.name == req_name for f in files):
            allocation_success = False
            message = f"File with name '{req_name}' already exists. Choose a unique file name."
        else:
            free_indices = [i for i, b in enumerate(disk_grid) if b.status == "free"]
            total_free = len(free_indices)

            if strat_key == "CONTIGUOUS":
                # Find contiguous chunk of size req_size
                found_start = None
                current_run = 0
                run_start = None

                for i, b in enumerate(disk_grid):
                    if b.status == "free":
                        if run_start is None:
                            run_start = i
                        current_run += 1
                        if current_run == req_size:
                            found_start = run_start
                            break
                    else:
                        current_run = 0
                        run_start = None

                if found_start is not None:
                    allocated = list(range(found_start, found_start + req_size))
                    for b_id in allocated:
                        disk_grid[b_id] = SimulatedDiskBlock(
                            block_id=b_id,
                            status="data",
                            file_name=req_name
                        )
                        steps.append(FileAllocationStep(
                            step_number=step_num,
                            action="allocate_block",
                            file_name=req_name,
                            block_id=b_id,
                            description=f"Contiguous block {b_id} allocated for '{req_name}'."
                        ))
                        step_num += 1

                    new_file = SimulatedFileRecord(
                        name=req_name,
                        size_blocks=req_size,
                        start_block=found_start,
                        allocated_blocks=allocated,
                        storage_overhead_blocks=0
                    )
                    files.append(new_file)
                    message = f"File '{req_name}' allocated contiguously from block {found_start} to {found_start + req_size - 1}."
                else:
                    allocation_success = False
                    if total_free >= req_size:
                        external_fragmentation = True
                        message = (
                            f"External Fragmentation detected! Total free blocks ({total_free}) >= requested ({req_size}), "
                            f"but no contiguous run of {req_size} blocks exists on disk."
                        )
                    else:
                        message = f"Insufficient disk space. Free blocks ({total_free}) < requested ({req_size})."

                    steps.append(FileAllocationStep(
                        step_number=step_num,
                        action="allocation_failed",
                        file_name=req_name,
                        block_id=None,
                        description=message
                    ))
                    step_num += 1

            elif strat_key == "INDEXED":
                # Requires 1 index block + req_size data blocks = req_size + 1 total blocks
                total_needed = req_size + 1
                if total_free < total_needed:
                    allocation_success = False
                    message = f"Insufficient disk space. Needed {total_needed} blocks (including 1 index block), but only {total_free} free blocks are available."
                    steps.append(FileAllocationStep(
                        step_number=step_num,
                        action="allocation_failed",
                        file_name=req_name,
                        block_id=None,
                        description=message
                    ))
                    step_num += 1
                else:
                    # Pick first free block as index block
                    index_block_id = free_indices[0]
                    data_block_ids = free_indices[1:total_needed]

                    disk_grid[index_block_id] = SimulatedDiskBlock(
                        block_id=index_block_id,
                        status="index",
                        file_name=req_name,
                        index_references=data_block_ids
                    )
                    steps.append(FileAllocationStep(
                        step_number=step_num,
                        action="allocate_index_block",
                        file_name=req_name,
                        block_id=index_block_id,
                        description=f"Allocated block {index_block_id} as the INDEX BLOCK for file '{req_name}'."
                    ))
                    step_num += 1

                    for d_id in data_block_ids:
                        disk_grid[d_id] = SimulatedDiskBlock(
                            block_id=d_id,
                            status="data",
                            file_name=req_name
                        )
                        steps.append(FileAllocationStep(
                            step_number=step_num,
                            action="allocate_data_block",
                            file_name=req_name,
                            block_id=d_id,
                            description=f"Allocated data block {d_id} and recorded entry in index block {index_block_id}."
                        ))
                        step_num += 1

                    new_file = SimulatedFileRecord(
                        name=req_name,
                        size_blocks=req_size,
                        start_block=index_block_id,
                        allocated_blocks=data_block_ids,
                        index_block=index_block_id,
                        storage_overhead_blocks=1
                    )
                    files.append(new_file)
                    message = f"File '{req_name}' allocated using Indexed Allocation (Index Block: {index_block_id}, Data: {data_block_ids})."

            elif strat_key == "LINKED":
                if total_free < req_size:
                    allocation_success = False
                    message = f"Insufficient disk space. Free blocks ({total_free}) < requested ({req_size})."
                    steps.append(FileAllocationStep(
                        step_number=step_num,
                        action="allocation_failed",
                        file_name=req_name,
                        block_id=None,
                        description=message
                    ))
                    step_num += 1
                else:
                    allocated = free_indices[:req_size]
                    chain = []

                    for idx, b_id in enumerate(allocated):
                        next_ptr = allocated[idx + 1] if idx + 1 < len(allocated) else -1
                        disk_grid[b_id] = SimulatedDiskBlock(
                            block_id=b_id,
                            status="data",
                            file_name=req_name,
                            next_block_id=next_ptr
                        )
                        chain.append({
                            "block": b_id,
                            "next": next_ptr if next_ptr != -1 else "EOF"
                        })
                        steps.append(FileAllocationStep(
                            step_number=step_num,
                            action="allocate_linked_block",
                            file_name=req_name,
                            block_id=b_id,
                            description=f"Allocated block {b_id} pointing to {next_ptr if next_ptr != -1 else 'EOF'}."
                        ))
                        step_num += 1

                    new_file = SimulatedFileRecord(
                        name=req_name,
                        size_blocks=req_size,
                        start_block=allocated[0],
                        allocated_blocks=allocated,
                        storage_overhead_blocks=0,
                        pointer_chain=chain
                    )
                    files.append(new_file)
                    message = f"File '{req_name}' allocated using Linked Allocation from head block {allocated[0]} to tail block {allocated[-1]}."

    occupied_count = sum(1 for b in disk_grid if b.status != "free")
    free_count = total_blocks - occupied_count

    return FileAllocationResponse(
        strategy=strat_key,
        total_blocks=total_blocks,
        free_blocks_count=free_count,
        occupied_blocks_count=occupied_count,
        disk_grid=disk_grid,
        files=files,
        external_fragmentation=external_fragmentation,
        allocation_success=allocation_success,
        message=message,
        steps=steps
    )
