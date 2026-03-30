#!/bin/zsh

set -euo pipefail

bucket_name="${R2_BUCKET_NAME:-${1:-}}"
cache_control="${R2_CACHE_CONTROL:-public, max-age=31536000, immutable}"
wrangler_cmd="${WRANGLER_CMD:-npx wrangler@latest}"
dry_run="${DRY_RUN:-0}"
max_wrangler_upload_bytes="${R2_MAX_WRANGLER_UPLOAD_BYTES:-314572800}"

if [[ -z "$bucket_name" ]]; then
  echo "Usage: R2_BUCKET_NAME=<bucket> ./scripts/upload-media-to-r2.sh" >&2
  echo "   or: ./scripts/upload-media-to-r2.sh <bucket>" >&2
  exit 1
fi

media_files=()

if [[ -d "public" ]]; then
  media_files=("${(@f)$(find public -type f \
    \( \
      -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' -o \
      -iname '*.avif' -o -iname '*.gif' -o -iname '*.svg' -o -iname '*.woff' -o \
      -iname '*.woff2' -o -iname '*.ttf' -o -iname '*.otf' -o -iname '*.eot' -o \
      -iname '*.mp4' -o -iname '*.mov' -o -iname '*.m4v' -o -iname '*.webm' \
    \) | sort)}")
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

  if [[ "$file" == public/projects/*/videos/* ]]; then
    file_size="$(stat -f%z "$file")"

    if (( file_size > max_wrangler_upload_bytes )); then
      printf 'Skipping %s (%s bytes); exceeds Wrangler upload threshold of %s bytes\n' \
        "$file" "$file_size" "$max_wrangler_upload_bytes" >&2
      continue
    fi
  fi

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
    *.woff)
      command+=(--content-type "font/woff")
      ;;
    *.woff2)
      command+=(--content-type "font/woff2")
      ;;
    *.ttf)
      command+=(--content-type "font/ttf")
      ;;
    *.otf)
      command+=(--content-type "font/otf")
      ;;
    *.eot)
      command+=(--content-type "application/vnd.ms-fontobject")
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
