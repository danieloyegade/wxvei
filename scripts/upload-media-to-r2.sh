#!/bin/zsh

set -euo pipefail

bucket_name="${R2_BUCKET_NAME:-${1:-}}"
cache_control="${R2_CACHE_CONTROL:-public, max-age=31536000, immutable}"
wrangler_cmd="${WRANGLER_CMD:-npx wrangler@latest}"
dry_run="${DRY_RUN:-0}"

if [[ -z "$bucket_name" ]]; then
  echo "Usage: R2_BUCKET_NAME=<bucket> ./scripts/upload-media-to-r2.sh" >&2
  echo "   or: ./scripts/upload-media-to-r2.sh <bucket>" >&2
  exit 1
fi

tracked_files=("${(@f)$(git ls-files public/projects public/site/photos)}")

media_files=()

for file in "${tracked_files[@]}"; do
  [[ -f "$file" ]] || continue

  case "${file:l}" in
    *.jpg|*.jpeg|*.png|*.webp|*.avif|*.gif|*.svg)
      media_files+=("$file")
      ;;
  esac
done

if [[ -d "public/projects" ]]; then
  video_files=("${(@f)$(find public/projects -type f \( -name '*.mp4' -o -name '*.mov' -o -name '*.m4v' -o -name '*.webm' \) | sort)}")
  media_files+=("${video_files[@]}")
fi

typeset -A seen_files
unique_files=()

for file in "${media_files[@]}"; do
  [[ -n "$file" && -f "$file" ]] || continue

  if [[ -n "${seen_files[$file]-}" ]]; then
    continue
  fi

  seen_files[$file]=1
  unique_files+=("$file")
done

if (( ${#unique_files[@]} == 0 )); then
  echo "No published media files found to upload." >&2
  exit 1
fi

for file in "${unique_files[@]}"; do
  object_key="${file#public/}"
  command=(
    ${(z)wrangler_cmd}
    r2 object put
    "${bucket_name}/${object_key}"
    --file "$file"
    --remote
    --cache-control "$cache_control"
  )

  case "${file:l}" in
    *.jpg|*.jpeg)
      command+=(--content-type "image/jpeg")
      ;;
    *.png)
      command+=(--content-type "image/png")
      ;;
    *.webp)
      command+=(--content-type "image/webp")
      ;;
    *.avif)
      command+=(--content-type "image/avif")
      ;;
    *.gif)
      command+=(--content-type "image/gif")
      ;;
    *.svg)
      command+=(--content-type "image/svg+xml")
      ;;
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
