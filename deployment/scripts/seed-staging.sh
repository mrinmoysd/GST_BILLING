#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/vyapar-genie}"
DEPLOYMENT_ROOT="$APP_ROOT/deployment/docker"
ENV_FILE="${STAGING_ENV_FILE:-$APP_ROOT/.env.staging}"
SEED_MODE="${SEED_MODE:-seed_only}"
RESET_CONFIRM="${RESET_CONFIRM:-}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Staging env file not found: $ENV_FILE" >&2
  exit 1
fi

compose() {
  docker compose --env-file "$ENV_FILE" -f "$DEPLOYMENT_ROOT/docker-compose.staging.yml" "$@"
}

compose up -d postgres redis

if [[ "$SEED_MODE" == "reset_then_seed" ]]; then
  if [[ "$RESET_CONFIRM" != "RESET_STAGING_DB" ]]; then
    echo "RESET_CONFIRM must equal RESET_STAGING_DB for reset_then_seed" >&2
    exit 1
  fi

  compose stop api web caddy || true
  compose run --rm api npx prisma migrate reset --force --skip-seed --schema prisma/schema.prisma
fi

compose run --rm api npm --workspace apps/api run prisma:migrate:deploy:prod
compose up -d api web caddy

for attempt in $(seq 1 30); do
  if compose exec -T api node -e "fetch('http://127.0.0.1:4000/health').then((res)=>process.exit(res.ok?0:1)).catch(()=>process.exit(1))"; then
    break
  fi
  sleep 2
done

seed_exec() {
  compose exec -T -e SEED_API_BASE_URL=http://127.0.0.1:4000/api api "$@"
}

seed_exec npm --workspace apps/api run seed:auth:prod
seed_exec npm --workspace apps/api run seed:distributor:prod
seed_exec npm --workspace apps/api run seed:full:prod
seed_exec npm --workspace apps/api run seed:comprehensive:prod

echo "Staging seed flow completed (${SEED_MODE})"
