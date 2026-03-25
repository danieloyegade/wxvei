#!/bin/zsh

set -euo pipefail

project_widths=(640 960 1440 1920)
portrait_widths=(480 720 960 1280)

generate_variants() {
  local input="$1"
  shift

  local stem="${input%.*}"

  for width in "$@"; do
    ffmpeg -loglevel error -y -i "$input" \
      -nostdin \
      -vf "scale=${width}:-2:flags=lanczos" \
      -frames:v 1 \
      -q:v 4 \
      "${stem}-${width}.jpg"
  done
}

while IFS= read -r cover; do
  generate_variants "$cover" "${project_widths[@]}"
done < <(find public/projects -path "*/photos/cover.jpg" | sort)

generate_variants "public/site/photos/daniel-oyegade.jpg" "${portrait_widths[@]}"
