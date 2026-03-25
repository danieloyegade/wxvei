#!/bin/zsh

set -euo pipefail

bucket_name="${R2_BUCKET_NAME:-${1:-}}"
video_root="${R2_VIDEO_ROOT:-public/projects}"
cache_control="${R2_CACHE_CONTROL:-public, max-age=31536000, immutable}"
wrangler_cmd="${WRANGLER_CMD:-npx wrangler@latest}"
dry_run="${DRY_RUN:-0}"

if [[ -z "$bucket_name" ]]; then
  echo "Usage: R2_BUCKET_NAME=<bucket> ./scripts/upload-videos-to-r2.sh" >&2
  echo "   or: ./scripts/upload-videos-to-r2.sh <bucket>" >&2
  exit 1
fi

if [[ ! -d "$video_root" ]]; then
  echo "Video root not found: $video_root" >&2
  exit 1
fi

video_files=("${(@f)$(find "$video_root" -type f \( -name '*.mp4' -o -name '*.mov' -o -name '*.m4v' -o -name '*.webm' \) | sort)}")

if (( ${#video_files[@]} == 0 )); then
  echo "No video files found under $video_root" >&2
  exit 1
fi

for file in "${video_files[@]}"; do
  object_key="${file#public/}"
  command=(
    ${(z)wrangler_cmd}
    r2 object put
    "${bucket_name}/${object_key}"
    --file "$file"
    --remote
    --cache-control "$cache_control"
  )

  case "$file" in
    *.mp4)
      command+=(--content-type "video/mp4")
      ;;
    *.mov)
      command+=(--content-type "video/quicktime")
      ;;
    *.m4v)
      command+=(--content-type "video/x-m4v")
      ;;
    *.webm)
      command+=(--content-type "video/webm")
      ;;
  esac

  if [[ "$dry_run" == "1" ]]; then
    printf '[dry-run] %q ' "${command[@]}"
    printf '\n'
    continue
  fi

  printf 'Uploading %s -> %s/%s\n' "$file" "$bucket_name" "$object_key"
  "${command[@]}"
done
