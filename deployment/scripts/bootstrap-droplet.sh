#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/vyapar-genie}"
DEPLOY_USER="${DEPLOY_USER:-$USER}"
APP_GROUP="${APP_GROUP:-$DEPLOY_USER}"

echo "Bootstrapping Vyapar Genie staging Droplet..."

export DEBIAN_FRONTEND=noninteractive

sudo apt-get update
sudo apt-get install -y \
  ca-certificates \
  curl \
  git \
  gnupg \
  lsb-release \
  jq \
  unzip \
  ufw \
  fail2ban

if ! command -v docker >/dev/null 2>&1; then
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

sudo systemctl enable docker
sudo systemctl start docker

if ! getent group docker >/dev/null; then
  sudo groupadd docker
fi
sudo usermod -aG docker "$DEPLOY_USER"

sudo mkdir -p \
  "$APP_ROOT" \
  "$APP_ROOT/deployment" \
  "$APP_ROOT/deployment/docker" \
  "$APP_ROOT/data" \
  "$APP_ROOT/backups" \
  "$APP_ROOT/caddy" \
  "$APP_ROOT/runner"

sudo chown -R "$DEPLOY_USER:$APP_GROUP" "$APP_ROOT"

sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

echo "Bootstrap complete."
echo "Important: log out and log back in before using Docker without sudo."
