import os
import requests
from typing import Any, Awaitable, Callable
from pydantic import TypeAdapter

from syris_core.config import HA_TOKEN as TOKEN, HA_URL
from syris_core.types.home_assistant import EntityState, EntityContext, ServiceSpec
from syris_core.home_assistant.interface import HomeAssistantInterface

TEST_LIGHT: EntityState = EntityState(
    entity_id="light.entrance_color_white_lights",
    state="on",
    attributes={
        "supported_color_modes": ["hs", "white"],
        "color_mode": "hs",
        "brightness": 180,
        "hs_color": [345, 75],
        "rgb_color": [255, 64, 112],
        "xy_color": [0.588, 0.274],
        "friendly_name": "Entrance Color + White Lights",
        "supported_features": 0,
    },
    last_changed=None,
    last_reported=None,
    last_updated=None,
    context=EntityContext(
        id="01KD48SJN9Z6D3YHSNCFYNP034", parent_id=None, user_id=None
    ),
)

TEST_SERVICE = {
    "domain": "persistent_notification",
    "services": {
        "create": {
            "fields": {
                "message": {
                    "required": True,
                    "example": "Please check your configuration.yaml.",
                    "selector": {"text": {"multiline": False, "multiple": False}},
                },
                "title": {
                    "example": "Test notification",
                    "selector": {"text": {"multiline": False, "multiple": False}},
                },
                "notification_id": {
                    "example": 1234,
                    "selector": {"text": {"multiline": False, "multiple": False}},
                },
            }
        },
        "dismiss": {
            "fields": {
                "notification_id": {
                    "required": True,
                    "example": 1234,
                    "selector": {"text": {"multiline": False, "multiple": False}},
                }
            }
        },
        "dismiss_all": {"fields": {}},
    },
}

HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

class TestHomeAssistantClient(HomeAssistantInterface):
    async def list_entities(self) -> list[EntityState]:
        r = requests.get(f"{HA_URL}/api/states", headers=HEADERS, timeout=10)
        r.raise_for_status()

        data: Any = r.json()

        adapter = TypeAdapter(list[EntityState])

        return adapter.validate_python(data)
        return [TEST_LIGHT]
        # return r.json()

    async def list_services(self) -> list[Any]:
        r = requests.get(f"{HA_URL}/api/services", headers=HEADERS, timeout=10)
        r.raise_for_status()

        return r.json()

    async def get_state(self, entity_id: str) -> EntityState:
        r = requests.get(f"{HA_URL}/api/states/{entity_id}", headers=HEADERS, timeout=10)
        r.raise_for_status()
        
        return r.json()

    async def call_service(self, domain: str, service: str, data: dict) -> Any:
        r = requests.post(f"{HA_URL}/api/services/{domain}/{service}", headers=HEADERS, json=data, timeout=10)
        r.raise_for_status()

        return r.json()

    async def subscribe_state_changes(
        self, callback: Callable[[EntityState], Awaitable[None]]
    ) -> None:
        return None
