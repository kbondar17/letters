from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict


class LetterBase(BaseModel):
    date: str
    ending: str
    text: str
    recipient: str | None = None
    iso_date: date | None = None
    location: str | None = None
    author: str | None = None
    reply_to: Optional[int] = None


class Letter(LetterBase):
    id: int


class LetterUpdate(BaseModel):
    """Partial update model for a letter."""

    model_config = ConfigDict(extra="forbid")

    location: Optional[str] = None
    date: Optional[str] = None
    iso_date: Optional[date] = None
    ending: Optional[str] = None
    text: Optional[str] = None
    author: Optional[str] = None
    reply_to: Optional[Optional[int]] = None


