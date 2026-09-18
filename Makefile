.PHONY: up down logs install dev

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

install:
	npm install

dev:
	npm run dev
