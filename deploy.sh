#!/usr/bin/env bash

# Deploy the latest uploaded Roll website image on the remote server.

set -euo pipefail

IMAGE_NAME="roll-website"
DEFAULT_CONFIG_FILE="./deploy.env.local"
FALLBACK_CONFIG_FILE="/Users/gt/yc/HM2.0/deploy.env.local"
CONFIG_FILE="${DEPLOY_CONFIG_FILE:-$DEFAULT_CONFIG_FILE}"

usage() {
  echo "Usage: $0"
  echo ""
  echo "Environment overrides:"
  echo "  DEPLOY_CONFIG_FILE=/path/to/deploy.env.local"
  echo "  ROLL_WEBSITE_REMOTE_DIR=/data/roll-website"
}

if [ "$#" -gt 0 ]; then
  echo "Error: this script does not accept arguments."
  usage
  exit 1
fi

if [ -f "$CONFIG_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$CONFIG_FILE"
  set +a
elif [ -z "${DEPLOY_CONFIG_FILE:-}" ] && [ -f "$FALLBACK_CONFIG_FILE" ]; then
  CONFIG_FILE="$FALLBACK_CONFIG_FILE"
  set -a
  # shellcheck disable=SC1090
  . "$CONFIG_FILE"
  set +a
else
  echo "Error: deploy config file not found: $CONFIG_FILE"
  echo "Set DEPLOY_CONFIG_FILE to use another config file."
  exit 1
fi

SERVER_USER="${DEPLOY_SERVER_USER:-}"
SERVER_HOST="${DEPLOY_SERVER_HOST:-}"
SERVER_PORT="${DEPLOY_SERVER_PORT:-}"
REMOTE_DIR="${ROLL_WEBSITE_REMOTE_DIR:-${DEPLOY_REMOTE_DIR:-/data/roll-website}}"

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Error: required command not found: $command_name"
    exit 1
  fi
}

require_config() {
  local missing=()

  [ -n "$SERVER_USER" ] || missing+=("DEPLOY_SERVER_USER")
  [ -n "$SERVER_HOST" ] || missing+=("DEPLOY_SERVER_HOST")
  [ -n "$SERVER_PORT" ] || missing+=("DEPLOY_SERVER_PORT")

  if [ "${#missing[@]}" -gt 0 ]; then
    echo "Error: missing deploy config: ${missing[*]}"
    echo "Please update $CONFIG_FILE or provide the variables in the environment."
    exit 1
  fi
}

require_command ssh
require_config

echo "Deploying latest ${IMAGE_NAME} image on ${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}..."

ssh -p "$SERVER_PORT" "${SERVER_USER}@${SERVER_HOST}" \
  "REMOTE_DIR='$REMOTE_DIR' IMAGE_NAME='$IMAGE_NAME' bash -se" <<'REMOTE_SCRIPT'
set -euo pipefail

cd "$REMOTE_DIR"

if [ ! -f docker-compose.yaml ]; then
  echo "Error: docker-compose.yaml not found in $REMOTE_DIR"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker command not found on remote server."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Error: docker compose is not available on remote server."
  exit 1
fi

latest_image=$(ls "${IMAGE_NAME}"-[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9].tar.gz 2>/dev/null | sort | tail -n 1)

if [ -z "$latest_image" ]; then
  echo "Error: no uploaded image found in $REMOTE_DIR"
  echo "Expected file pattern: ${IMAGE_NAME}-YYYYMMDDHHMMSS.tar.gz"
  exit 1
fi

echo "Using image: $latest_image"

md5_file="${latest_image%.tar.gz}.md5"
if [ -f "$md5_file" ]; then
  echo "Verifying checksum: $md5_file"
  if command -v md5sum >/dev/null 2>&1; then
    md5sum -c "$md5_file"
  else
    echo "Warning: md5sum not found; skipping checksum verification."
  fi
fi

echo "Loading Docker image..."
gunzip -c "$latest_image" | docker load

echo "Restarting service..."
docker compose -f docker-compose.yaml up -d --force-recreate

echo "Current service status:"
docker compose -f docker-compose.yaml ps
REMOTE_SCRIPT
