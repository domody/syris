import json

from typing import Any, Literal
from syris_core.llm.provider import LLMProvider
from syris_core.types.llm import Intent, PlanExecutionResult
from syris_core.util.logger import log

class ResponseComposer:
    def __init__(self, provider: LLMProvider, system_prompt: str):
        self.provider = provider
        self.system_prompt = system_prompt

    async def compose(
            self,
            intent: Intent,
            user_input: str,
            result: dict[str, Any] | None = None,
            status: str = "normal",
            instructions: str | None = None
    ):
        intent_json = json.dumps(intent.model_dump(), ensure_ascii=False)
        # prompt = (
        #     f"Intent: {intent_json}\n"
        #     f"User message: {user_input}\n"
        #     f"Execution results: {result}\n"
        #     f"Status: {status}"
        # )
        final_prompt = self.system_prompt + instructions if isinstance(instructions, str) else self.system_prompt

        # log("llm", f"[ResponseComposer] Generating reply (status={status}) (prompt={prompt})")

        response = await self.provider.complete(system_prompt=final_prompt)
        raw: str = response['message']['content']

        return raw.strip()
    
    # compose optimistic / error / tool response ?? / summarize

    async def compose_optimistic(
            self,
            intent: Intent,
            user_input: str,
    ):
        optimistic_prompt = "Produce a short confirmation message acknowledging the request.\nMaximum 7 words. No explanation. Maintain SYRIS tone.\nExamples:\n - “Right away, sir.”\n - “On it, sir.”\n - “Initiating now.”\n - “Working on that.”\n - “As you wish.”\n - “Beginning the process.”\n - “Understood.”\n - “Certainly.”"

        return await self.compose(
            intent=intent, 
            user_input=user_input,
            instructions=optimistic_prompt,
            status="confirm"
        )
    
    async def compose_plan_summary(
            self,
            result: PlanExecutionResult,
            status: Literal["success", "partial", "failed"]
    ):  
    
        assert result.end_time
        
        plan_summary_prompt = f"""
You are summarizing the outcome of a completed plan execution.

Your task:
- Clearly communicate the outcome of the plan to the user.
- Maintain a concise, calm, assistant-style tone.
- Address the user as "sir".

Guidelines:
- Begin with a brief statement indicating whether the plan succeeded, partially succeeded, or failed.
- If the plan succeeded:
    - Confirm completion.
    - Present only the most relevant results or findings.
    - Do NOT dump raw data unless it is directly useful to the user.
- If the plan partially succeeded:
    - Explain what was completed successfully.
    - Clearly state which parts failed.
    - Briefly explain why those failures occurred, if known.
- If the plan failed:
    - Clearly state that the plan could not be completed.
    - Identify what failed.
    - Explain the failure reason using available error information.
- If the plan produced no meaningful user-facing output:
    - Acknowledge completion without unnecessary detail.

Additional rules:
- Do NOT describe internal system mechanics unless required to explain a failure.
- Do NOT mention tool names or step IDs unless they help explain what went wrong.
- Prefer summarization over enumeration.
- Keep the response brief but informative.

You are provided with structured execution data below.
Use it as factual reference when generating your response.
Do NOT invent information that is not present in this data.

Examples (for style and tone only):
- Success:
    - "Your system diagnostic is complete, sir. CPU and memory usage are within normal limits, and no critical issues were detected."
- Partial success:
    - "The system briefing was mostly completed, sir. Diagnostics were gathered successfully, however log analysis could not be finalized due to insufficient file permissions."
- Failure:
    - "I was unable to complete the requested operation, sir. The process failed while attempting to write to the log directory due to permission restrictions."
- Silent completion:
    - "The task has been completed, sir."

--- PLAN EXECUTION CONTEXT ---

Plan name:
{result.plan_name}

User request:
{result.user_input}

Execution status:
{result.user_input}

Completed steps:
{", ".join(result.completed_steps) if len(result.completed_steps) > 0 else "None"}

Failed steps:
{", ".join(result.failed_steps) if len(result.failed_steps) > 0 else "None"}

Step results:
{json.dumps(result.step_results, indent=2)}

Final aggregated results:
{json.dumps(result.results, indent=2)}

Execution time (seconds):
{result.end_time - result.start_time:.2f}

Exception (if any):
{result.exception or "None"}

--- END OF PLAN EXECUTION CONTEXT ---

"""

        response = await self.provider.complete(system_prompt=plan_summary_prompt)
        raw: str = response['message']['content']

        return raw.strip()