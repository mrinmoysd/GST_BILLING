#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_LOG="${ROOT_DIR}/tmp/reset-seed-api.log"

mkdir -p "${ROOT_DIR}/tmp"
cd "${ROOT_DIR}"

cleanup() {
  if [[ -n "${API_PID:-}" ]] && kill -0 "${API_PID}" >/dev/null 2>&1; then
    kill "${API_PID}" >/dev/null 2>&1 || true
    wait "${API_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT

echo "==> Resetting database schema"
npx dotenv -e .env -- npx prisma migrate reset --schema prisma/schema.prisma --force --skip-seed

echo "==> Generating Prisma client"
npm --workspace apps/api run prisma:generate

echo "==> Seeding auth/bootstrap"
npm --workspace apps/api run seed:auth

echo "==> Building API"
npm --workspace apps/api run build

if lsof -iTCP:4000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port 4000 is already in use. Stop the existing API process before running reset_and_seed_local.sh." >&2
  exit 1
fi

echo "==> Starting API for flow-based seeds"
node "${ROOT_DIR}/apps/api/dist/main.js" >"${API_LOG}" 2>&1 &
API_PID=$!

for _ in {1..60}; do
  if curl -fsS http://localhost:4000/health >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS http://localhost:4000/health >/dev/null 2>&1; then
  echo "API failed to start. See ${API_LOG}" >&2
  exit 1
fi

echo "==> Seeding distributor workflows"
SEED_PREFIX=GST npm --workspace apps/api run seed:distributor

echo "==> Seeding additional transactional demo data"
SEED_PREFIX=GST \
SEED_CUSTOMERS=8 \
SEED_SUPPLIERS=4 \
SEED_PRODUCTS=12 \
SEED_INVOICES=10 \
SEED_PURCHASES=6 \
npm --workspace apps/api run seed:full

echo "==> Seeding advanced modules"
SEED_PREFIX=GST npm --workspace apps/api run seed:comprehensive

echo "==> Comprehensive reset and seed completed"
echo "API log: ${API_LOG}"
