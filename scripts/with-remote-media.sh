#!/bin/zsh

set -euo pipefail

default_media_base_url="https://pub-8f9c84a430fe4288a47ed8a11d8c12be.r2.dev"

export PUBLIC_ASSET_SOURCE="${PUBLIC_ASSET_SOURCE:-remote}"
export PUBLIC_IMAGE_SOURCE="${PUBLIC_IMAGE_SOURCE:-remote}"
export PUBLIC_VIDEO_SOURCE="${PUBLIC_VIDEO_SOURCE:-remote}"
export PUBLIC_MEDIA_BASE_URL="${PUBLIC_MEDIA_BASE_URL:-$default_media_base_url}"
export PUBLIC_PROJECT_VIDEO_BASE_URL="${PUBLIC_PROJECT_VIDEO_BASE_URL:-${PUBLIC_MEDIA_BASE_URL}}"

if (( $# == 0 )); then
  echo "Usage: ./scripts/with-remote-media.sh <command> [args...]" >&2
  exit 1
fi

exec "$@"
