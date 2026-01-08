from typing import Any

from .schema_resolver import resolve_schema_json
from ..models.intent import Subaction

def build_fill_guide_from_schema_json(
    schema: dict[str, Any],
    *,
    max_fields: int = 10,
    include_optionals: bool = True,
) -> str:
    props: dict[str, Any] = schema.get("properties", {}) or {}
    required: list[str] = schema.get("required", []) or []

    def format_field(field_name: str) -> str | None:
        if field_name not in props:
            return None

        p = props[field_name] or {}
        desc = (p.get("description") or "").strip() or "No description."

        ex = p.get("examples")
        if ex is None:
            ex = p.get("example")

        line = f"- {field_name}: {desc}"
        if ex:
            ex_list = ex if isinstance(ex, list) else [ex]
            ex_list = [str(x) for x in ex_list[:3]]
            line += f" Examples: {', '.join(ex_list)}"
        return line
    
    required_fields = [f for f in required if f in props]
    optional_fields = [f for f in props.keys() if f not in required]

    lines: list[str] = []
    if required:
        lines.append("Required fields:")
    else:
        lines.append("Fields:")

    if not required_fields:
        lines.append("Fields:")
        count = 0
        for f in (required_fields + optional_fields):
            if count >= max_fields:
                break
            line = format_field(f)
            if line:
                lines.append(line)
                count += 1
        return "\n".join(lines)

    lines.append("Required fields:")
    count = 0
    for f in required_fields:
        if count >= max_fields:
            break
        line = format_field(f)
        if line:
            lines.append(line)
            count += 1

    if include_optionals and count < max_fields:
        opt_lines: list[str] = []
        for f in optional_fields:
            if count >= max_fields:
                break
            line = format_field(f)
            if line:
                opt_lines.append(line)
                count += 1

        if opt_lines:
            lines.append("")
            lines.append("Optional fields:")
            lines.extend(opt_lines)

    return "\n".join(lines)


def build_argument_filler_prompt(subaction: Subaction, schema: dict[str, Any]) -> str:
    guide = build_fill_guide_from_schema_json(schema=schema)

    return (
        "You are IntentArgumentFiller.\n"
        "Return ONLY a JSON object that matches the provided schema.\n"
        "Do not include any extra keys, comments, or text.\n"
        f"{subaction.prompt_line}\n"
        f"{subaction.fill_guidance}\n"
        f"{guide}\n"
    )
