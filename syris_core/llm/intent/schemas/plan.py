from pydantic import BaseModel, Field


class PlanCreateArgs(BaseModel):
    goal: str = Field(
        description="User goal or problem statement the plan should address.",
    )
    context: str | None = Field(
        default=None,
        description="Additional context or constraints to consider in the plan.",
    )
    output_format: str | None = Field(
        default=None,
        description="Preferred format for the plan output (checklist, numbered steps, etc.).",
    )


class PlanGenerateReportArgs(BaseModel):
    topic: str = Field(
        description="Topic or system to generate a report about.",
    )
    scope: str | None = Field(
        default=None,
        description="Scope, timeframe, or boundaries for the report.",
    )
    focus: str | None = Field(
        default=None,
        description="Specific findings or questions to prioritize in the report.",
    )


class PlanRunDiagnosticsArgs(BaseModel):
    system: str = Field(
        description="System or device area to run diagnostics against.",
    )
    symptoms: str | None = Field(
        default=None,
        description="Observed symptoms or issues that prompted diagnostics.",
    )
    constraints: str | None = Field(
        default=None,
        description="Constraints or preferences for the diagnostic workflow.",
    )
