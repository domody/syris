import importlib
import inspect
import pathlib
import pkgutil
from typing import Any, get_type_hints

from pydantic import BaseModel, Field, create_model

TOOL_FUNCTIONS = []
TOOL_PROMPT_LIST = ""
TOOL_REGISTRY = {}
TOOL_MANIFEST = []

TOOLS_DIR = pathlib.Path(__file__).parent
PACKAGE_PREFIX = "syris_core.tools"

def _build_tool_args_model(func) -> type[BaseModel]:
    sig = inspect.signature(func)
    try:
        hints = get_type_hints(func)
    except Exception:
        hints = {}
    fields: dict[str, tuple[Any, Any]] = {}

    for name, param in sig.parameters.items():
        if name in ("self", "cls"):
            continue
        if param.kind in (
            inspect.Parameter.VAR_POSITIONAL,
            inspect.Parameter.VAR_KEYWORD,
        ):
            continue

        annotation = hints.get(name, Any)
        default = (
            param.default
            if param.default is not inspect.Parameter.empty
            else ...
        )
        fields[name] = (annotation, default)

    model_name = "".join(part.title() for part in func.__name__.split("_")) + "Args"
    return create_model(model_name, **fields)


def _normalize_input_schema(schema: Any) -> dict[str, Any]:
    if not isinstance(schema, dict):
        return {"type": "object", "properties": {}, "required": []}

    normalized = dict(schema)
    normalized.setdefault("type", "object")
    normalized.setdefault("properties", {})
    normalized.setdefault("required", [])
    return normalized


def _wrap_tool_schema(input_schema: dict[str, Any]) -> dict[str, Any]:
    input_schema = _normalize_input_schema(input_schema)
    return {
        "type": "object",
        "properties": {"arguments": input_schema},
        "required": ["arguments"],
    }


def _build_tool_schema(
    func, metadata: dict[str, Any]
) -> tuple[type[BaseModel] | None, dict[str, Any]]:
    input_schema = metadata.get("input_schema")
    if isinstance(input_schema, dict) and input_schema:
        input_schema = _normalize_input_schema(input_schema)
        metadata["input_schema"] = input_schema
        return None, _wrap_tool_schema(input_schema)

    args_model = _build_tool_args_model(func)
    input_schema = args_model.model_json_schema()
    metadata["input_schema"] = input_schema
    wrapper_model = create_model(
        f"{args_model.__name__}Wrapper",
        arguments=(args_model, Field(..., description="Tool arguments.")),
    )
    return wrapper_model, wrapper_model.model_json_schema()

for module_info in pkgutil.iter_modules([str(TOOLS_DIR)]):
    folder_name = module_info.name
    folder_package = f"{PACKAGE_PREFIX}.{folder_name}"

    if folder_name == "registry":
        continue

    folder = importlib.import_module(folder_package)

    for submodule_info in pkgutil.iter_modules(folder.__path__):
        file_name = submodule_info.name
        full_module_path = f"{folder_package}.{file_name}"

        module = importlib.import_module(full_module_path)

        if not hasattr(module, file_name):
            continue

        func = getattr(module, file_name)
        TOOL_FUNCTIONS.append(func)

        tool_key = f"{folder_name}.{file_name}"
        metadata = getattr(module, "METADATA", None) or {}
        description = metadata.get("description", f"Tool: {tool_key}")
        schema_model, schema_json = _build_tool_schema(func, metadata)

        TOOL_REGISTRY[tool_key] = {
            "func": func,
            "metadata": metadata,
            "schema_model": schema_model,
            "schema_json": schema_json,
        }

        tool_dict = {
            "type": "function",
            "function": {
                "name": tool_key,
                "description": description,
                "parameters": {
                    "type": "object",
                    "properties": {},
                },
            },
            "py_function": func,
        }

        TOOL_MANIFEST.append(tool_dict)

        TOOL_PROMPT_LIST = (
            TOOL_PROMPT_LIST
            + f"\n- {tool_key}: {metadata.get('description', f'No description')}"
        )

# print(TOOL_REGISTRY)
