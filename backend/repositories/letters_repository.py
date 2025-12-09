from datetime import date
from pathlib import Path
from typing import Optional

from backend.models import Letter, LetterUpdate
from tinydb import TinyDB, Query


class InMemoryLettersRepository:
    """Concrete repository implementation using TinyDB."""

    def __init__(self, data_path: Path):
        self.db_path = Path(__file__).parent.parent / "letters.json"
        self.db = TinyDB(self.db_path)
        self.table = self.db.table("letters")
        if data_path:
            self.init_db(data_path)

    def init_db(self, data_path: Path):
        """Initialize database from external JSON file."""

        self.table.truncate()

        for file in data_path.glob('*.json'):
            with open(file, 'r', encoding='utf-8') as f:
                data = f.read()
                if data.strip():  # Only if file has content
                    import json
                    letters_data = json.loads(data)
                    for letter_dict in letters_data:
                        letter_dict['id'] = len(self.table) + 1
                        self.table.insert(letter_dict)

    async def list(self, author: str | None = None) -> list[Letter]:
        query = Query()
        if author:
            docs = self.table.search(query.author == author)
        else:
            docs = self.table.all()
        return [Letter.model_validate(doc) for doc in docs]

    async def get(self, letter_id: int) -> Optional[Letter]:
        letter = self.table.get(doc_id=letter_id)
        if letter:
            return Letter.model_validate(letter)
        return None

