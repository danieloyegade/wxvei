#!/bin/zsh

set -euo pipefail

video_root="${1:-public/projects}"
base_url="${PUBLIC_PROJECT_VIDEO_BASE_URL:-https://media.example.com}"
base_url="${base_url%/}"

if [[ ! -d "$video_root" ]]; then
  echo "Video root not found: $video_root" >&2
  exit 1
fi

find "$video_root" -type f \( -name '*.mp4' -o -name '*.mov' -o -name '*.m4v' -o -name '*.webm' \) | sort |
while IFS= read -r file; do
  relative_path="/${file#public/}"
  size_bytes=$(stat -f '%z' "$file")
  size_mb=$(awk -v bytes="$size_bytes" 'BEGIN { printf "%.1f", bytes / 1048576 }')

  printf '%s\t%s MB\t%s%s\n' "$relative_path" "$size_mb" "$base_url" "$relative_path"
done
