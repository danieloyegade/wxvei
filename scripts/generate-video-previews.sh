#!/bin/zsh

set -euo pipefail

mode="all"

if [[ "${1:-}" == "--previews-only" ]]; then
  mode="previews-only"
fi

master_root="${MASTER_VIDEO_ROOT:-media/masters/projects}"
public_root="${PUBLIC_VIDEO_ROOT:-public/projects}"
content_root="${CONTENT_ROOT:-src/content/projects}"
delivery_width="${DELIVERY_VIDEO_MAX_WIDTH:-1600}"
preview_width="${PREVIEW_VIDEO_WIDTH:-1280}"
ffmpeg_bin="${FFMPEG_BIN:-/tmp/ffmpeg-static-install/node_modules/ffmpeg-static/ffmpeg}"

if [[ ! -x "$ffmpeg_bin" ]]; then
  ffmpeg_bin="$(command -v ffmpeg || true)"
fi

if [[ -z "$ffmpeg_bin" || ! -x "$ffmpeg_bin" ]]; then
  echo "ffmpeg is required to prepare delivery and preview videos." >&2
  exit 1
fi

if [[ ! -d "$master_root" ]]; then
  echo "Master video root not found: $master_root" >&2
  exit 1
fi

choose_master_source() {
  local video_dir="$1"
  local -a candidates=()
  local candidate

  for candidate in "$video_dir"/*(.N); do
    case "${candidate:t:l}" in
      preview.*)
        continue
        ;;
      *.mov|*final*.mp4|*feature*.mp4|*.mp4|*.m4v|*.webm)
        candidates+=("$candidate")
        ;;
    esac
  done

  if (( ${#candidates[@]} == 0 )); then
    return 1
  fi

  local pattern
  for pattern in "*feature*.mov" "*final*.mov" "*.mov" "*feature*.mp4" "*final*.mp4" "*.mp4" "*.m4v" "*.webm"; do
    for candidate in "${candidates[@]}"; do
      if [[ "${candidate:t:l}" == ${~pattern} ]]; then
        print -r -- "$candidate"
        return 0
      fi
    done
  done

  print -r -- "${candidates[1]}"
}

read_preview_timing() {
  local slug="$1"
  local content_file

  content_file="$(find "$content_root" -maxdepth 1 -type f -iname "*.md" -print | while IFS= read -r file; do
    if grep -Eq "^slug:\s*\"?$slug\"?\s*$" "$file" || [[ "${file:t:r:l}" == "${slug:l}" ]]; then
      print -r -- "$file"
      break
    fi
  done)"

  if [[ -z "$content_file" ]]; then
    print "0 10"
    return 0
  fi

  local start_time="0"
  local end_time="10"
  local in_hover_preview="false"
  local line

  while IFS= read -r line; do
    case "$line" in
      hoverPreview:)
        in_hover_preview="true"
        ;;
      [![:space:]]*)
        if [[ "$in_hover_preview" == "true" ]]; then
          break
        fi
        ;;
      "  startTime:"*)
        if [[ "$in_hover_preview" == "true" ]]; then
          start_time="${line#  startTime: }"
        fi
        ;;
      "  endTime:"*)
        if [[ "$in_hover_preview" == "true" ]]; then
          end_time="${line#  endTime: }"
        fi
        ;;
    esac
  done < "$content_file"

  print "$start_time $end_time"
}

transcode_delivery() {
  local input_path="$1"
  local output_path="$2"

  mkdir -p "${output_path:h}"

  "$ffmpeg_bin" -loglevel error -y \
    -i "$input_path" \
    -nostdin \
    -map_metadata -1 \
    -movflags +faststart \
    -vf "scale='min(${delivery_width},iw)':-2:flags=lanczos" \
    -c:v libx264 \
    -preset slow \
    -crf 23 \
    -maxrate 5500k \
    -bufsize 11000k \
    -pix_fmt yuv420p \
    -c:a aac \
    -b:a 128k \
    "$output_path"
}

generate_preview() {
  local input_path="$1"
  local output_path="$2"
  local start_time="$3"
  local end_time="$4"
  local duration

  duration="$(awk -v start="$start_time" -v end="$end_time" 'BEGIN {
    value = end - start;
    if (value <= 0) value = 10;
    printf "%.3f", value;
  }')"

  mkdir -p "${output_path:h}"

  "$ffmpeg_bin" -loglevel error -y \
    -ss "$start_time" \
    -t "$duration" \
    -i "$input_path" \
    -nostdin \
    -an \
    -map_metadata -1 \
    -movflags +faststart \
    -vf "fps=24,scale='min(${preview_width},iw)':-2:flags=lanczos" \
    -c:v libx264 \
    -preset slow \
    -crf 28 \
    -maxrate 1800k \
    -bufsize 3600k \
    -pix_fmt yuv420p \
    "$output_path"
}

while IFS= read -r video_dir; do
  local_slug="${video_dir:h:t}"
  public_video_dir="${public_root}/${local_slug}/videos"
  feature_output="${public_video_dir}/feature.mp4"
  preview_output="${public_video_dir}/preview.mp4"
  master_source="$(choose_master_source "$video_dir" || true)"

  if [[ -z "$master_source" ]]; then
    printf 'Skipping %s: no source video found\n' "$local_slug" >&2
    continue
  fi

  read -r preview_start preview_end <<<"$(read_preview_timing "$local_slug")"

  if [[ "$mode" != "previews-only" ]]; then
    transcode_delivery "$master_source" "$feature_output"
    printf 'Generated delivery %s\n' "$feature_output"
  fi

  generate_preview "$master_source" "$preview_output" "$preview_start" "$preview_end"
  printf 'Generated preview %s\n' "$preview_output"
done < <(find "$master_root" -mindepth 2 -maxdepth 2 -type d -name videos | sort)
