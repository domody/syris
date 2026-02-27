import asyncio

from syris_core.config import Settings
from syris_core.runtime.control_plane import ControlPlane

def main() -> None:
    settings = Settings()
    control_plane = ControlPlane(settings)
    asyncio.run(control_plane.run())

if __name__ == "__main__":
    main()