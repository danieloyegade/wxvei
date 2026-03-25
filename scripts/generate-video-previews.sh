#!/bin/zsh

set -euo pipefail

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required to generate preview videos." >&2
  exit 1
fi

create_preview() {
  local input_path="$1"
  local output_path="$2"
  local start_time="$3"
  local duration="$4"

  if [[ ! -f "$input_path" ]]; then
    echo "Source video not found: $input_path" >&2
    exit 1
  fi

  mkdir -p "${output_path:h}"

  ffmpeg -y \
    -ss "$start_time" \
    -t "$duration" \
    -i "$input_path" \
    -an \
    -vf "fps=24,scale='min(1280,iw)':-2" \
    -c:v libx264 \
    -preset slow \
    -crf 28 \
    -maxrate 1800k \
    -bufsize 3600k \
    -pix_fmt yuv420p \
    -movflags +faststart \
    -map_metadata -1 \
    "$output_path"

  local size_bytes
  local size_mb
  size_bytes="$(stat -f '%z' "$output_path")"
  size_mb="$(awk -v bytes="$size_bytes" 'BEGIN { printf "%.2f", bytes / 1048576 }')"
  printf 'Generated %s (%s MB)\n' "$output_path" "$size_mb"
}

create_preview "public/projects/someplace-else/videos/feature.mp4" \
  "public/projects/someplace-else/videos/preview.mp4" \
  "12" \
  "10"

create_preview "public/projects/moving-images-in-g-sharp-minor/videos/feature.mp4" \
  "public/projects/moving-images-in-g-sharp-minor/videos/preview.mp4" \
  "6" \
  "10"

create_preview "public/projects/saucony/videos/feature.mp4" \
  "public/projects/saucony/videos/preview.mp4" \
  "0" \
  "10"

create_preview "public/projects/of-the-sublime-and-beautiful/videos/feature.mp4" \
  "public/projects/of-the-sublime-and-beautiful/videos/preview.mp4" \
  "8" \
  "10"

create_preview "public/projects/annabella/videos/AnnabellaFINAL.mp4" \
  "public/projects/annabella/videos/preview.mp4" \
  "0" \
  "12"
