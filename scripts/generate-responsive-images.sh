#!/bin/zsh

set -euo pipefail

project_widths=(640 960 1440 1920)
portrait_widths=(480 720 960 1280)

ffmpeg_bin="${FFMPEG_BIN:-/tmp/ffmpeg-static-install/node_modules/ffmpeg-static/ffmpeg}"

if [[ ! -x "$ffmpeg_bin" ]]; then
  ffmpeg_bin="$(command -v ffmpeg || true)"
fi

if [[ -z "$ffmpeg_bin" || ! -x "$ffmpeg_bin" ]]; then
  echo "ffmpeg is required to generate responsive images." >&2
  exit 1
fi

should_skip_input() {
  local input_lower="${1:l}"

  case "$input_lower" in
    *-480.jpg|*-640.jpg|*-720.jpg|*-960.jpg|*-1280.jpg|*-1440.jpg|*-1920.jpg)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

generate_variants() {
  local input="$1"
  shift

  if should_skip_input "$input"; then
    return
  fi

  local stem="${input%.*}"

  for width in "$@"; do
    local output_path="${stem}-${width}.jpg"

    if [[ -f "$output_path" && "$output_path" -nt "$input" ]]; then
      continue
    fi

    "$ffmpeg_bin" -loglevel error -y -i "$input" \
      -nostdin \
      -vf "scale='min(${width},iw)':-2:flags=lanczos" \
      -frames:v 1 \
      -q:v 4 \
      "$output_path"
  done
}

while IFS= read -r image_path; do
  generate_variants "$image_path" "${project_widths[@]}"
done < <(
  existing_roots=()

  for candidate_root in public/projects public/blog; do
    if [[ -d "$candidate_root" ]]; then
      existing_roots+=("$candidate_root")
    fi
  done

  if (( ${#existing_roots[@]} > 0 )); then
    find "${existing_roots[@]}" -type f \
      \( -iname '*.jpg' -o -iname '*.jpeg' \) \
      | sort
  fi
)

generate_variants "public/site/photos/daniel-oyegade.jpg" "${portrait_widths[@]}"
