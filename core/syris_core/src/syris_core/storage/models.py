from datetime import datetime, timezone
import uuid
from typing import ClassVar

from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Index
from sqlalchemy.types import DateTime

from ..version import VERSION

class SystemHeartbeat(SQLModel, table=True):
    __tablename__: ClassVar[str] = "system_heartbeats"
    __table_args__: tuple = (
        Index("ix_system_heartbeats_ts", "ts"),
    )   

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)

    # unique per process id, allows correlating ids
    run_id: uuid.UUID = Field(index=True)



    ts: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), 
        # index=True, 
        sa_column=Column(DateTime(timezone=True), nullable=False),
        # sa_type=DateTime(timezone=True),
        # sa_type=Column(DateTime(timezone=True), nullable=False)
    )

    status: str = Field(default="healthy", max_length=32)
    uptime_s: int = Field(default=0, ge=0)

    service: str = Field(default="syris-core", max_length=64)
    version: str = Field(default=VERSION, max_length=64)