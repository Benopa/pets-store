#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="${IMAGE_NAME:-vmalkov/petstore-nest}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"

docker buildx build \
  --platform "${PLATFORMS}" \
  --tag "${IMAGE_NAME}:${IMAGE_TAG}" \
  --push \
  .
