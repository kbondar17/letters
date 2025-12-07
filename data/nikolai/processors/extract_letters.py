import json
import re
from pathlib import Path

from bs4 import BeautifulSoup


HEADER_RE = re.compile(
    r"^\s*(?P<location>.+?)\s+(?P<date>\d{1,2}\s+[А-Яа-яЁё.]+\s+\d{4}\s*г\.)",
    re.IGNORECASE,
)


MONTHS = {
    "января": 1,
    "январь": 1,
    "янв": 1,
    "февраля": 2,
    "февраль": 2,
    "февр": 2,
    "марта": 3,
    "март": 3,
    "мар": 3,
    "апреля": 4,
    "апрель": 4,
    "апр": 4,
    "мая": 5,
    "май": 5,
    "июня": 6,
    "июнь": 6,
    "июл": 7,
    "июля": 7,
    "июль": 7,
    "августа": 8,
    "август": 8,
    "сентября": 9,
    "сентябрь": 9,
    "сен": 9,
    "октября": 10,
    "октябрь": 10,
    "окт": 10,
    "ноября": 11,
    "ноябрь": 11,
    "ноя": 11,
    "декабря": 12,
    "декабрь": 12,
    "дек": 12,
}


def parse_iso_date(date_str: str) -> str | None:
    """Парсит русскую дату вида '1 января 1916 г.' в формат ISO YYYY-MM-DD."""
    s = date_str.lower()
    m = re.search(r"(\d{1,2})\s+([а-яё.]+)\s+(\d{4})", s)
    if not m:
        return None

    day = int(m.group(1))
    month_word = m.group(2).rstrip(".")
    year = int(m.group(3))

    month = MONTHS.get(month_word)
    if not month:
        return None

    return f"{year:04d}-{month:02d}-{day:02d}"


def split_sentences(text: str) -> list[str]:
    """Очень простой сплит по предложениям."""
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def parse_letters(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")

    letters: list[dict] = []
    current = None

    for p in soup.find_all("p"):
        full = p.get_text(separator="\n", strip=True)
        if not full:
            continue

        lines = full.splitlines()
        first_line = lines[0]
        m = HEADER_RE.match(first_line)

        if m:
            # Закрываем предыдущее письмо
            if current is not None:
                text = "\n\n".join(current["text_parts"]).strip()
                current["text"] = text

                sentences = split_sentences(text)
                current["ending"] = " ".join(sentences[-3:]) if sentences else ""

                # Удаляем вспомогательное поле
                del current["text_parts"]
                letters.append(current)

            # Начинаем новое письмо
            body_lines = lines[1:]  # всё после первой строки — тело письма
            iso_date = parse_iso_date(m.group("date"))
            location = m.group("location").strip().rstrip(".")

            current = {
                "location": location,
                "date": m.group("date").strip(),
                "iso_date": iso_date,
                "text_parts": ["\n".join(body_lines).strip()] if body_lines else [],
                "ending": "",
                "text": "",
            }
        else:
            # Обычный абзац: относим к текущему письму
            if current is not None:
                current["text_parts"].append(full)

    # Финальное письмо
    if current is not None:
        text = "\n\n".join(current["text_parts"]).strip()
        current["text"] = text
        sentences = split_sentences(text)
        current["ending"] = " ".join(sentences[-3:]) if sentences else ""
        del current["text_parts"]
        letters.append(current)

    return letters


def main():
    data_path = Path("data.html")
    out_path = Path("letters.json")

    html = data_path.read_text(encoding="utf-8")
    letters = parse_letters(html)

    # добавляем порядковый индекс письма (начиная с 1)
    for i, letter in enumerate(letters, start=1):
        letter["id"] = i

    out_path.write_text(json.dumps(letters, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Extracted {len(letters)} letters to {out_path}")


if __name__ == "__main__":
    main()


