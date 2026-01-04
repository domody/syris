import json
import time
import websockets
import requests
from typing import Any, Awaitable, Callable, Optional
from pydantic import TypeAdapter

from syris_core.config import HA_TOKEN as TOKEN, HA_URL
from syris_core.types.home_assistant import EntityState, EntityContext, ServiceSpec
from syris_core.home_assistant.interface import HomeAssistantInterface
from syris_core.util.logger import log
from syris_core.types.events import Event, EventType
from syris_core.events.bus import EventBus

HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}


class HomeAssistantWSClient(HomeAssistantInterface):
    def __init__(self, event_bus: EventBus) -> None:
        self.event_bus = event_bus

    async def list_entities(self) -> list[EntityState]:
        r = requests.get(f"{HA_URL}/api/states", headers=HEADERS, timeout=10)
        r.raise_for_status()

        data: Any = r.json()

        adapter = TypeAdapter(list[EntityState])

        return adapter.validate_python(data)

    async def list_services(self) -> list[Any]:
        r = requests.get(f"{HA_URL}/api/services", headers=HEADERS, timeout=10)
        r.raise_for_status()

        return r.json()

    async def get_state(self, entity_id: str) -> EntityState:
        r = requests.get(
            f"{HA_URL}/api/states/{entity_id}", headers=HEADERS, timeout=10
        )
        r.raise_for_status()

        return r.json()

    async def call_service(self, domain: str, service: str, data: dict) -> Any:
        r = requests.post(
            f"{HA_URL}/api/services/{domain}/{service}",
            headers=HEADERS,
            json=data,
            timeout=10,
        )
        r.raise_for_status()

        return r.json()

    async def subscribe_state_changes(
        self, callback: Callable[[Optional[EntityState], EntityState], Awaitable[None]]
    ) -> None:
        ws_url = (
            HA_URL.replace("http://", "ws://").replace("https://", "wss://")
            + "/api/websocket"
        )
        async with websockets.connect(ws_url) as ws:
            # receive auth req
            await ws.recv()

            await ws.send(json.dumps({"type": "auth", "access_token": TOKEN}))
            auth_resp = json.loads(await ws.recv())
            if auth_resp.get("type") != "auth_ok":
                raise RuntimeError("WS Auth Failed")
            
            await self.event_bus.publish(
                Event(
                    type=EventType.SYSTEM,
                    source="home_assistant",
                    payload={
                        "kind": "integration.health",
                        "integration_id": "home_assistant",
                        "patch": {
                            "connected": True, 
                            "ws_alive": True, 
                            "last_error": None,
                            "details": {"phase": "connected"}, 
                        },
                    },
                    timestamp=time.time(),
                )
            )

            await ws.send(
                json.dumps(
                    {"id": 1, "type": "subscribe_events", "event_type": "state_changed"}
                )
            )
            await ws.recv()

            while True:
                msg = json.loads(await ws.recv())

                if msg.get("type") != "event":
                    continue
                event = msg.get("event", {})
                new_state = event.get("data", {}).get("new_state")
                if not new_state:
                    continue
                new_entity = EntityState.model_validate(new_state)
                old_entity = event.get("data", {}).get("old_state")
                if not old_entity:
                    old_entity = None
                else:
                    old_entity = EntityState.model_validate(old_entity)

                await callback(old_entity, new_entity)
