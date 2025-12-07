import json
import re
from pathlib import Path


def detect_author(ending: str | None) -> str | None:
  """
  Пытаемся определить автора письма по подписи в ending.

  Возвращает "Nickolai", "Alexandra" или None, если уверенности нет.
  """
  if not ending:
    return None

  e = ending.lower()

  # Явные подписи Николая II
  if re.search(r"\bники\b", e):
    return "Nickolai"
  if "муженек" in e:
    return "Nickolai"

  # Характерные подписи Александры Фёдоровны
  if "женушка" in e:
    return "Alexandra"
  if "солнышко" in e and "ники" not in e:
    # если в подписи она называет себя Солнышком, а не обращается к Ники
    return "Alexandra"
  if "твоя маленькая" in e or "твоя старая" in e or "твоя до смерти" in e:
    return "Alexandra"

  return None


def main():
  letters_path = Path("letters.json")
  out_path = Path("letters_authors.json")

  letters = json.loads(letters_path.read_text(encoding="utf-8"))

  result: list[dict] = []
  for letter in letters:
    letter_id = letter.get("id")
    ending = letter.get("ending")
    author = detect_author(ending)
    result.append({"id": letter_id, "author": author})

  out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
  print(f"Written {len(result)} records to {out_path}")


if __name__ == "__main__":
  main()


