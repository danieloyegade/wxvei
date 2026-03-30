#!/usr/bin/env bash

set -euo pipefail

exec "$(dirname "$0")/with-remote-media.sh" astro build "$@"
