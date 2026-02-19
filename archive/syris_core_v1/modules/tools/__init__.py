import pkgutil
import importlib

TOOLS = []
TOOL_MAP = {}

package = __path__
for module_info in pkgutil.iter_modules(package):
    module_name = module_info.name
    module = importlib.import_module(f"{__name__}.{module_name}")

    if hasattr(module, module_name):
        func = getattr(module, module_name)
        TOOLS.append(func)

        if hasattr(module, "METADATA"):
            TOOL_MAP[module_name] = {"func": func, "metadata": module.METADATA}
        else:
            TOOL_MAP[module_name] = {"func": func, "metadata": None}
