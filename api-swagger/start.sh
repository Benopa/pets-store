#!/bin/bash
set -euo pipefail

export DB_USERNAME="${DB_USERNAME:-app}"
export DB_PASSWORD="${DB_PASSWORD:-app}"
export DB_NAME="${DB_NAME:-petstore}"
export DB_HOST="${DB_HOST:-localhost}"
export DB_PORT="${DB_PORT:-5432}"
export JWT_SECRET="${JWT_SECRET:-change_me}"
export ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
export UPLOAD_DIR="${UPLOAD_DIR:-/app/uploads}"

export PGDATA="/var/lib/postgresql/data"

PG_BIN=""
if command -v pg_config >/dev/null 2>&1; then
  PG_BIN="$(pg_config --bindir)"
elif [ -d /usr/lib/postgresql ]; then
  for bin_dir in /usr/lib/postgresql/*/bin; do
    if [ -x "$bin_dir/initdb" ]; then
      PG_BIN="$bin_dir"
      break
    fi
  done
fi

if [ -z "$PG_BIN" ]; then
  echo "Postgres binaries not found (initdb missing)." >&2
  exit 1
fi

mkdir -p "$PGDATA" "$UPLOAD_DIR"
chown -R postgres:postgres "$PGDATA"

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  su - postgres -c "$PG_BIN/initdb -D $PGDATA"
  su - postgres -c "$PG_BIN/pg_ctl -D $PGDATA -o \"-c listen_addresses='*'\" -w start"
  init_sql="/tmp/init.sql"
  cat > "$init_sql" <<EOSQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USERNAME}') THEN
    CREATE ROLE ${DB_USERNAME} LOGIN PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;
EOSQL

  su - postgres -c "$PG_BIN/psql -v ON_ERROR_STOP=1 --username postgres --file $init_sql"

  if ! su - postgres -c "$PG_BIN/psql -tAc \"SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'\"" | grep -q 1; then
    su - postgres -c "$PG_BIN/psql -v ON_ERROR_STOP=1 --username postgres -c \"CREATE DATABASE ${DB_NAME} OWNER ${DB_USERNAME};\""
  fi
  su - postgres -c "$PG_BIN/pg_ctl -D $PGDATA -m fast -w stop"
fi

su - postgres -c "$PG_BIN/pg_ctl -D $PGDATA -o \"-c listen_addresses='*'\" -w start"

node dist/main.js
