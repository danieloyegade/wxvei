#!/bin/zsh

set -euo pipefail

"$(dirname "$0")/with-remote-media.sh" astro build "$@"
