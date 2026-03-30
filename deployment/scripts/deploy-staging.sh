#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/vyapar-genie}"
DEPLOYMENT_ROOT="$APP_ROOT/deployment/docker"
ENV_FILE="${STAGING_ENV_FILE:-$APP_ROOT/.env.staging}"
SOURCE_DEPLOY_DIR="${SOURCE_DEPLOY_DIR:-$(pwd)/deployment/docker}"

if [[ -z "${API_IMAGE:-}" || -z "${WEB_IMAGE:-}" ]]; then
  echo "API_IMAGE and WEB_IMAGE must be set" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Staging env file not found: $ENV_FILE" >&2
  exit 1
fi

mkdir -p "$DEPLOYMENT_ROOT"
rm -rf "$DEPLOYMENT_ROOT"/*
cp -R "$SOURCE_DEPLOY_DIR"/. "$DEPLOYMENT_ROOT"/

export API_IMAGE
export WEB_IMAGE

compose() {
  docker compose --env-file "$ENV_FILE" -f "$DEPLOYMENT_ROOT/docker-compose.staging.yml" "$@"
}

compose pull api web caddy postgres redis
compose up -d postgres redis
compose run --rm api npm --workspace apps/api run prisma:migrate:deploy
compose up -d --no-build api web caddy

for attempt in $(seq 1 30); do
  if compose exec -T api node -e "fetch('http://127.0.0.1:4000/health').then((res)=>process.exit(res.ok?0:1)).catch(()=>process.exit(1))"; then
    echo "API health check passed"
    docker image prune -f >/dev/null 2>&1 || true
    exit 0
  fi
  sleep 2
done

echo "API health check did not pass after deployment" >&2
compose ps >&2 || true
exit 1
