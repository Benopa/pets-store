#!/usr/bin/env bash
# Запуск/обновление прод-стека Pets Store на сервере.
#
#   ./deploy.sh           # собрать образы и поднять стек (db + api + web)
#   ./deploy.sh --rebuild  # пересобрать образы без кэша и перезапустить
#   ./deploy.sh --down     # остановить стек (тома с данными сохраняются)
#   ./deploy.sh --logs     # хвост логов всех сервисов
#
# База инициализируется дампом из db/init/ ТОЛЬКО при первом старте
# (когда том db-data пуст). Картинки из api-swagger/uploads вшиты в образ
# и наследуются томом uploads при первом создании.
set -euo pipefail

cd "$(dirname "$0")"

# docker compose v2 (плагин) или v1 (docker-compose)?
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "ОШИБКА: не найден docker compose. Установи Docker Engine + compose-плагин." >&2
  exit 1
fi

# .env для compose: создаём из примера при первом запуске.
if [ ! -f .env ]; then
  cp .env.deploy.example .env
  echo "Создан .env из .env.deploy.example."
  echo ">>> ОТРЕДАКТИРУЙ .env и задай секреты (JWT_SECRET, ADMIN_PASSWORD, DB_PASSWORD), затем запусти снова."
  exit 0
fi

WEB_PORT="$(grep -E '^WEB_PORT=' .env | cut -d= -f2)"
WEB_PORT="${WEB_PORT:-8080}"

# Превентивная проверка: не занят ли публикуемый порт другим процессом/контейнером.
# Только предупреждаем — поднимаем лишь свой проект, чужие контейнеры не трогаем.
port_in_use() {
  if command -v ss >/dev/null 2>&1; then
    ss -ltnH "sport = :$1" 2>/dev/null | grep -q .
  elif command -v netstat >/dev/null 2>&1; then
    netstat -ltn 2>/dev/null | grep -qE "[:.]$1[[:space:]]"
  else
    return 1
  fi
}
if [ "${1:-up}" != "--down" ] && [ "${1:-up}" != "--logs" ] && port_in_use "$WEB_PORT"; then
  echo "ВНИМАНИЕ: порт ${WEB_PORT} на сервере уже занят (его слушает другой сервис)." >&2
  echo "          Смени WEB_PORT в .env на свободный и запусти снова —" >&2
  echo "          иначе поднимется только db+api, а web упадёт с 'port is already allocated'." >&2
  echo "          (Чужие контейнеры при этом не затрагиваются.)" >&2
  exit 1
fi

case "${1:-up}" in
  --down)
    echo "Останавливаю стек (тома сохраняются)..."
    $DC down
    ;;
  --logs)
    $DC logs -f --tail=100
    ;;
  --rebuild)
    echo "Пересобираю образы без кэша..."
    $DC build --no-cache
    $DC up -d
    ;;
  up|"")
    echo "Собираю образы и поднимаю стек..."
    $DC up -d --build
    ;;
  *)
    echo "Неизвестный аргумент: $1" >&2
    echo "Допустимо: (без аргумента) | --rebuild | --down | --logs" >&2
    exit 1
    ;;
esac

# Короткий статус после старта.
if [ "${1:-up}" = "up" ] || [ "${1:-up}" = "" ] || [ "${1:-up}" = "--rebuild" ]; then
  echo ""
  $DC ps
  echo ""
  echo "Готово. Сайт:        http://<server-ip>:${WEB_PORT}/"
  echo "       Swagger:      http://<server-ip>:${WEB_PORT}/docs"
  echo "Логи:  ./deploy.sh --logs"
fi
