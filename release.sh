#!/usr/bin/env bash

# Build the Roll website Docker image, export it as a tar.gz archive,
# and upload the archive to the deployment server.

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
  echo "  ROLL_WEBSITE_OUTPUT_DIR=./docker-images"
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

write_md5() {
  local image_file="$1"
  local md5_file="$2"
  local file_name
  local md5_value

  file_name=$(basename "$image_file")

  if command -v md5sum >/dev/null 2>&1; then
    md5_value=$(md5sum "$image_file" | awk '{print $1}')
  elif command -v md5 >/dev/null 2>&1; then
    md5_value=$(md5 -q "$image_file")
  else
    echo "Warning: neither md5sum nor md5 was found; skipping checksum generation."
    return
  fi

  echo "$md5_value  $file_name" >"$md5_file"
  echo "MD5: $md5_value"
}

cleanup_old_images() {
  local image_tag="$1"

  shopt -s nullglob

  for file in "$OUTPUT_DIR"/${IMAGE_NAME}-[0-9]*.tar.gz; do
    local file_name
    file_name=$(basename "$file")

    if [[ "$file_name" =~ ^${IMAGE_NAME}-[0-9]{14}\.tar\.gz$ && "$file_name" != "${IMAGE_NAME}-${image_tag}.tar.gz" ]]; then
      rm -f "$file"
    fi
  done

  for file in "$OUTPUT_DIR"/${IMAGE_NAME}-[0-9]*.md5; do
    local file_name
    file_name=$(basename "$file")

    if [[ "$file_name" =~ ^${IMAGE_NAME}-[0-9]{14}\.md5$ && "$file_name" != "${IMAGE_NAME}-${image_tag}.md5" ]]; then
      rm -f "$file"
    fi
  done

  shopt -u nullglob
}

if ! grep -qx "\\.env" .dockerignore || ! grep -qx "\\.env\\.\\*" .dockerignore; then
  echo "Error: .dockerignore does not ignore both .env and .env.* files."
  echo "This may package secrets into the Docker image."
  exit 1
fi

if [ ! -f pnpm-lock.yaml ]; then
  echo "Error: pnpm-lock.yaml was not found."
  echo "Run pnpm install before building the Docker image."
  exit 1
fi

require_command docker
require_command ssh
require_command scp
require_command gzip
require_config

BUILD_TIMESTAMP=$(date +%Y%m%d%H%M%S)
OUTPUT_FILE="$OUTPUT_DIR/${IMAGE_NAME}-${BUILD_TIMESTAMP}.tar.gz"
MD5_FILE="$OUTPUT_DIR/${IMAGE_NAME}-${BUILD_TIMESTAMP}.md5"

echo "Building ${IMAGE_NAME}:${BUILD_TIMESTAMP} for linux/amd64..."
docker build --platform linux/amd64 \
  -t "${IMAGE_NAME}:${BUILD_TIMESTAMP}" \
  -t "${IMAGE_NAME}:latest" \
  .

mkdir -p "$OUTPUT_DIR"

IMAGE_ID=$(docker images "${IMAGE_NAME}:${BUILD_TIMESTAMP}" --format '{{.ID}}' 2>/dev/null)
if [ -z "$IMAGE_ID" ]; then
  echo "Error: image not found after build: ${IMAGE_NAME}:${BUILD_TIMESTAMP}"
  exit 1
fi

echo "Exporting ${IMAGE_NAME}:${BUILD_TIMESTAMP} and ${IMAGE_NAME}:latest to ${OUTPUT_FILE}..."
docker save "${IMAGE_NAME}:${BUILD_TIMESTAMP}" "${IMAGE_NAME}:latest" | gzip >"$OUTPUT_FILE"

if [ ! -f "$OUTPUT_FILE" ]; then
  echo "Error: image archive was not created: $OUTPUT_FILE"
  exit 1
fi

FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
echo "Image archive created: $OUTPUT_FILE ($FILE_SIZE)"

write_md5 "$OUTPUT_FILE" "$MD5_FILE"
cleanup_old_images "$BUILD_TIMESTAMP"

FILE_NAME=$(basename "$OUTPUT_FILE")

echo "Uploading ${OUTPUT_FILE} to ${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}..."
ssh -p "$SERVER_PORT" "${SERVER_USER}@${SERVER_HOST}" "mkdir -p '$REMOTE_DIR'"
scp -P "$SERVER_PORT" "$OUTPUT_FILE" "${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}/"

echo "Upload complete: ${REMOTE_DIR}/${FILE_NAME}"
