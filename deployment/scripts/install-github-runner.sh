#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/vyapar-genie}"
RUNNER_ROOT="${RUNNER_ROOT:-$APP_ROOT/runner}"
RUNNER_VERSION="${RUNNER_VERSION:-2.328.0}"
RUNNER_ARCHIVE="actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
RUNNER_URL="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${RUNNER_ARCHIVE}"

REPO_URL="${REPO_URL:-}"
RUNNER_TOKEN="${RUNNER_TOKEN:-}"
RUNNER_NAME="${RUNNER_NAME:-gst-billing-staging}"
RUNNER_LABELS="${RUNNER_LABELS:-gst-billing-staging}"

if [[ -z "$REPO_URL" || -z "$RUNNER_TOKEN" ]]; then
  echo "REPO_URL and RUNNER_TOKEN are required" >&2
  exit 1
fi

mkdir -p "$RUNNER_ROOT"
cd "$RUNNER_ROOT"

if [[ ! -f "$RUNNER_ARCHIVE" ]]; then
  curl -fsSL -o "$RUNNER_ARCHIVE" "$RUNNER_URL"
fi

tar xzf "$RUNNER_ARCHIVE"

./config.sh \
  --url "$REPO_URL" \
  --token "$RUNNER_TOKEN" \
  --name "$RUNNER_NAME" \
  --labels "$RUNNER_LABELS" \
  --unattended \
  --replace

sudo ./svc.sh install
sudo ./svc.sh start

echo "Runner installed and started."
