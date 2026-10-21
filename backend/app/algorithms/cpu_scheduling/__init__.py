from app.algorithms.cpu_scheduling.fcfs import simulate_fcfs
from app.algorithms.cpu_scheduling.sjf import simulate_sjf
from app.algorithms.cpu_scheduling.round_robin import simulate_round_robin
from app.algorithms.cpu_scheduling.priority import simulate_priority

__all__ = ["simulate_fcfs", "simulate_sjf", "simulate_round_robin", "simulate_priority"]
