from typing import Any

from fastapi import APIRouter, Request

router = APIRouter(tags=["systetm"])

@router.get("/audit")
async def audit(request: Request) -> list:
    app = request.app

    return []