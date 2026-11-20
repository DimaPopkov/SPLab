.DEFAULT_GOAL := help

COMPOSE := docker compose
APP_NAME := SPLab

.PHONY: help up up-build down restart logs logs-backend logs-nginx ps rebuild-front rebuild-back psql clean

help: ## Показать список доступных команд
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

up: ## Запустить все контейнеры в фоне
	$(COMPOSE) up -d

up-build: ## Собрать образы и запустить все контейнеры
	$(COMPOSE) up -d --build

down: ## Остановить и удалить контейнеры (данные БД сохранятся)
	$(COMPOSE) down

restart: ## Перезапустить все контейнеры
	$(COMPOSE) restart

ps: ## Показать статус всех контейнеров
	$(COMPOSE) ps

logs: ## Смотреть логи всех сервисов в реальном времени
	$(COMPOSE) logs -f --tail=100

logs-backend: ## Смотреть логи только FastAPI бэкенда
	$(COMPOSE) logs -f --tail=100 backend

logs-nginx: ## Смотреть логи только Nginx
	$(COMPOSE) logs -f --tail=100 nginx

rebuild-front: ## Пересобрать и перезапустить только frontend
	$(COMPOSE) up -d --build --no-deps frontend

rebuild-back: ## Пересобрать и перезапустить только backend
	$(COMPOSE) up -d --build --no-deps backend

psql: ## Открыть консоль PostgreSQL внутри контейнера
	$(COMPOSE) exec postgres psql -U $${POSTGRES_USER:-secscan} -d $${POSTGRES_DB:-secscan_db}

clean: ## Остановить контейнеры и УДАЛИТЬ volumes (очистка БД и RabbitMQ!)
	$(COMPOSE) down -v
