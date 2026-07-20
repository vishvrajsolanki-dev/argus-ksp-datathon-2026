.PHONY: seed embed train test api fe compose
seed:
	python db/seed.py --reset
embed:
	python db/embed.py
train:
	python -c "from ml.gbm_model import train_and_save; print(train_and_save())"
test:
	pytest -q backend/tests
api:
	uvicorn backend.main:app --reload --port 8000
fe:
	cd frontend && npm run dev
compose:
	docker compose up --build
