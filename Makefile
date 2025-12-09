run:
	uv run uvicorn backend.main:app --reload --port 8000

reqs:
	uv export --format requirements-txt > requirements.txt