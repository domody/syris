import pkgutil
import importlib
import pathlib

TOOLS = []
TOOL_MAP = {}
OLLAMA_MAP = []

TOOLS_DIR = pathlib.Path(__file__).parent
PACKAGE_PREFIX = "syris_core.tools"

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
        TOOLS.append(func)

        tool_key = f"{folder_name}.{file_name}"
        metadata = getattr(module, "METADATA", None) or {}

        TOOL_MAP[tool_key] = {
            "func": func,
            "metadata": metadata,
        }

        tool_dict = {
            "type": "function",
            "function": {
                "name": tool_key,
                "description": metadata.get("description", f"Tool: {tool_key}"),

                "parameters": {
                    "type": "object",
                    "properties": {},
                },
            },
            "py_function": func
        }

        OLLAMA_MAP.append(tool_dict)