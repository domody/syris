import time
from typing import Dict, Any

from syris_core.types.llm import Plan, PlanStep, PlanExecutionResult
from syris_core.tools.registry import TOOL_REGISTRY

class PlanExecutor:
    def __init__(self):
        self.tool_registry = TOOL_REGISTRY

    async def execute(self, user_text:str, plan: Plan) -> PlanExecutionResult:
        start_time = time.time()

        result = PlanExecutionResult(
            plan_name = plan.name,
            user_input = user_text,
            completed_steps = [],
            failed_steps = [],
            step_results = {},
            results = {},
            start_time = start_time,
            end_time = None
        )
        
        for step in plan.steps:
            try:
                if not self._can_execute_step(step=step, results=result):
                    if step.skip_on_failure:
                        continue

                    raise RuntimeError(f"Dependency failure for step '{step.id}'")

                output = await self._execute_step(step=step)

                result.completed_steps.append(step.id)
                result.step_results[step.id] = output
                result.results[step.id] = output

            except Exception as e:
                result.failed_steps.append(step.id)
                result.step_results[step.id] = {"error": str(e)}
                result.exception = str(e)
                result.results[step.id] = f"Failed due to error: {str(e)}"

                if step.skip_on_failure:
                    result.status = "partial"
                    continue

                result.status = "failed"
                break
        
        result.end_time = time.time()
        if result.status == "in_progress":
            result.status = "partial" if result.failed_steps else "success"

        return result
    
    def _can_execute_step(
            self,
            step: PlanStep,
            results: PlanExecutionResult
    ):
        if not step.depends_on:
            return True
        

    async def _execute_step(self, step: PlanStep) -> Any:
        entry = TOOL_REGISTRY.get(step.tool)

        if not entry:
            raise RuntimeError(f"Tool not found: {step.tool}")

        func = entry["func"]

        if not callable(func):
            raise RuntimeError(f"Invalid tool function: {step.tool}")
        
        if hasattr(func, "__call__"):
            return func(**step.arguments)
        
        raise RuntimeError(f"Tool is not callable: {step.tool}")