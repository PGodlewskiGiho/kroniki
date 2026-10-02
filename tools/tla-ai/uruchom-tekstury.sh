#!/bin/sh
# Tekstury terenu (tekstury.py) w środowisku SD jak uruchom.sh
V=$(dirname "$0")/../portrety-ai/venv
if [ -x "$V/bin/python" ]; then LD_PRELOAD=$V/stub/libcuextra.so LD_LIBRARY_PATH=$V/stub exec "$V/bin/python" "$(dirname "$0")/tekstury.py" "$@"; fi
exec "${SD_VENV:-/home/user/sd/venv}/bin/python" "$(dirname "$0")/tekstury.py" "$@"
