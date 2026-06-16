#!/usr/bin/env bash

# Deploy the latest uploaded Roll website image on the remote server.

set -euo pipefail

IMAGE_NAME="roll-website"
DEFAULT_CONFIG_FILE="./deploy.env.local"
CONFIG_FILE="${DEPLOY_CONFIG_FILE:-$DEFAULT_CONFIG_FILE}"

usage() {
  echo "Usage: $0"
  echo ""
  echo "Environment overrides:"
  echo "  DEPLOY_CONFIG_FILE=/path/to/deploy.env.local"
  echo "  ROLL_WEBSITE_REMOTE_DIR=/path/on/server"
  echo "  ROLL_WEBSITE_IMAGE_FILE=roll-website-YYYYMMDDHHMMSS.tar.gz"
  echo "  ROLL_WEBSITE_OUTPUT_DIR=./docker-images"
  echo "  ROLL_WEBSITE_RELEASE_STATE_FILE=./docker-images/roll-website-latest.env"
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
else
  echo "Error: deploy config file not found: $CONFIG_FILE"
  echo "Set DEPLOY_CONFIG_FILE to use another config file."
  exit 1
fi

SERVER_USER="${DEPLOY_SERVER_USER:-}"
SERVER_HOST="${DEPLOY_SERVER_HOST:-}"
SERVER_PORT="${DEPLOY_SERVER_PORT:-}"
REMOTE_DIR="${ROLL_WEBSITE_REMOTE_DIR:-${DEPLOY_REMOTE_DIR:-}}"
OUTPUT_DIR="${ROLL_WEBSITE_OUTPUT_DIR:-${DEPLOY_OUTPUT_DIR:-./docker-images}}"
RELEASE_STATE_FILE="${ROLL_WEBSITE_RELEASE_STATE_FILE:-$OUTPUT_DIR/${IMAGE_NAME}-latest.env}"
IMAGE_FILE="${ROLL_WEBSITE_IMAGE_FILE:-}"

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
  [ -n "$REMOTE_DIR" ] || missing+=("ROLL_WEBSITE_REMOTE_DIR")

  if [ "${#missing[@]}" -gt 0 ]; then
    echo "Error: missing deploy config: ${missing[*]}"
    echo "Please update $CONFIG_FILE or provide the variables in the environment."
    exit 1
  fi
}

validate_remote_dir() {
  if [[ "$REMOTE_DIR" != /* ]]; then
    echo "Error: ROLL_WEBSITE_REMOTE_DIR must be an absolute path."
    exit 1
  fi

  if [[ ! "$REMOTE_DIR" =~ ^/[A-Za-z0-9._/-]+$ ]]; then
    echo "Error: ROLL_WEBSITE_REMOTE_DIR contains unsupported characters."
    echo "Allowed characters: letters, numbers, slash, dot, underscore, and hyphen."
    exit 1
  fi

  if [[ "$REMOTE_DIR" == *"/../"* || "$REMOTE_DIR" == *"/.." ]]; then
    echo "Error: ROLL_WEBSITE_REMOTE_DIR must not contain '..' path segments."
    exit 1
  fi
}

read_release_state() {
  local key
  local value

  if [ -n "$IMAGE_FILE" ] || [ ! -f "$RELEASE_STATE_FILE" ]; then
    return
  fi

  while IFS='=' read -r key value; do
    if [ "$key" = "ROLL_WEBSITE_IMAGE_FILE" ]; then
      IMAGE_FILE="$value"
      return
    fi
  done <"$RELEASE_STATE_FILE"
}

validate_image_file() {
  if [ -z "$IMAGE_FILE" ]; then
    echo "Warning: ROLL_WEBSITE_IMAGE_FILE is not set; falling back to latest uploaded image."
    return
  fi

  if [[ ! "$IMAGE_FILE" =~ ^${IMAGE_NAME}-[0-9]{14}\.tar\.gz$ ]]; then
    echo "Error: ROLL_WEBSITE_IMAGE_FILE has an invalid file name: $IMAGE_FILE"
    echo "Expected file pattern: ${IMAGE_NAME}-YYYYMMDDHHMMSS.tar.gz"
    exit 1
  fi
}

print_deploy_next_steps() {
  echo ""
  echo "[deploy] 后续验证:"
  printf "  ssh -p %q %q %q\n" \
    "$SERVER_PORT" \
    "${SERVER_USER}@${SERVER_HOST}" \
    "cd $(printf "%q" "$REMOTE_DIR") && docker compose -f docker-compose.yaml ps && docker logs roll-website --tail 100"
}

require_command ssh
require_config
validate_remote_dir
read_release_state
validate_image_file

if [ -n "$IMAGE_FILE" ]; then
  echo "Deploying selected ${IMAGE_NAME} image on ${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}: $IMAGE_FILE"
else
  echo "Deploying latest ${IMAGE_NAME} image on ${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}..."
fi

QUOTED_DIR=$(printf '%q' "$REMOTE_DIR")
QUOTED_IMAGE_FILE=$(printf '%q' "$IMAGE_FILE")
ssh -p "$SERVER_PORT" "${SERVER_USER}@${SERVER_HOST}" \
  "REMOTE_DIR=$QUOTED_DIR IMAGE_NAME=roll-website IMAGE_FILE=$QUOTED_IMAGE_FILE bash -se" <<'REMOTE_SCRIPT'
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

if [ -n "${IMAGE_FILE:-}" ]; then
  latest_image="$IMAGE_FILE"
  if [ ! -f "$latest_image" ]; then
    echo "Error: selected uploaded image was not found in $REMOTE_DIR: $latest_image"
    exit 1
  fi
else
  latest_image=$(ls "${IMAGE_NAME}"-[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9].tar.gz 2>/dev/null | sort | tail -n 1)
fi

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

echo "部署成功: ${IMAGE_NAME}:latest 已通过 docker compose 启动。"
REMOTE_SCRIPT

echo "[deploy] 部署成功: ${IMAGE_NAME}:latest 已在 ${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR} 重启"
print_deploy_next_steps
