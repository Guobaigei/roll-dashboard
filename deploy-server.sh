#!/usr/bin/env bash

# Build, upload, and deploy the Roll website Docker image in one command.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

usage() {
  echo "Usage: pnpm deploy:server"
  echo ""
  echo "Environment overrides:"
  echo "  DEPLOY_CONFIG_FILE=/path/to/deploy.env.local"
  echo "  ROLL_WEBSITE_REMOTE_DIR=/data/roll-website"
  echo "  ROLL_WEBSITE_OUTPUT_DIR=./docker-images"
}

if [ "$#" -gt 0 ]; then
  echo "Error: this script does not accept arguments."
  usage
  exit 1
fi

echo "[deploy:server] Step 1/2: build and upload Docker image..."
bash "$SCRIPT_DIR/release.sh"

echo "[deploy:server] Step 2/2: deploy latest uploaded image..."
bash "$SCRIPT_DIR/deploy.sh"

echo "[deploy:server] Deployment completed."
