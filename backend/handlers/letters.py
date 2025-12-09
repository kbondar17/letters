from __future__ import annotations

from fastapi import APIRouter, HTTPException, Depends
from typing import List
from pathlib import Path

from backend.models.letter import Letter, LetterUpdate
from backend.repositories.letters_repository import InMemoryLettersRepository
from tinydb import Query


letters_router = APIRouter(prefix="/letters", tags=["letters"])

# Instantiate repository directly
repo = InMemoryLettersRepository(data_path=Path("data/nikolai/prod"))


@letters_router.get("/", response_model=List[Letter])
async def list_letters(author: str | None = None):
    return await repo.list(author)


@letters_router.get("/{letter_id}", response_model=Letter)
async def get_letter(letter_id: int):
    letter = await repo.get(letter_id)
    if not letter:
        raise HTTPException(status_code=404, detail="Letter not found")
    return letter


@letters_router.patch("/{letter_id}", response_model=Letter)
async def update_letter(letter_id: int, update_data: LetterUpdate):
    updated = await repo.update_letter(letter_id, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Letter not found")
    return updated


