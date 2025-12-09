import json

IN = "/Users/makbuk/prog/projects/letters/data/nikolai/prod/willy.json"
OUT = "/Users/makbuk/prog/projects/letters/data/nikolai/prod/willy.json"

with open(IN, 'r', encoding='utf-8') as f:
    data = json.load(f)


for item in data:
    if item["author"] == "Wilhelm":
        item['recipient'] = "Nikolai"
    elif item["author"] == "Nikolai":
        item['recipient'] = "Wilhelm"
    else:
        item['recipient'] = None



with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)