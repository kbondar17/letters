import json
from datetime import datetime

INPUT_FILE = "merged_letters.json"
OUTPUT_FILE = "merged_letters_threaded.json"


def parse_date(letter):
  iso = letter.get("iso_date")
  if not iso:
    return None
  try:
    return datetime.fromisoformat(iso)
  except ValueError:
    return None


def main():
  with open(INPUT_FILE, "r", encoding="utf-8") as f:
    letters = json.load(f)

  prev_date = None
  prev_id = None

  for letter in letters:
    current_date = parse_date(letter)

    # по умолчанию нет связи с предыдущим письмом
    reply_to = None

    if prev_date is not None and current_date is not None:
      delta_days = (current_date.date() - prev_date.date()).days
      # если разница в датах не более одного дня – считаем ответом
      if 0 <= delta_days <= 1:
        reply_to = prev_id

    letter["reply_to"] = reply_to

    # обновляем "предыдущее" письмо только если есть дата
    if current_date is not None:
      prev_date = current_date
      prev_id = letter.get("id")

  with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(letters, f, ensure_ascii=False, indent=2)

  print(f"Готово. Результат записан в {OUTPUT_FILE}")


if __name__ == "__main__":
  main()