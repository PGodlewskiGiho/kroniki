#!/bin/sh
# Uruchamia generuj.py w venv z tools/portrety-ai (torch z PyPI bez bibliotek CUDA działa na procesorze dzięki atrapom w venv/stub);
# gdy go nie ma, w venv z /home/user/sd (SD_VENV), gdzie torch działa bez atrap.
V=$(dirname "$0")/../portrety-ai/venv
if [ -x "$V/bin/python" ]; then LD_PRELOAD=$V/stub/libcuextra.so LD_LIBRARY_PATH=$V/stub exec "$V/bin/python" "$(dirname "$0")/generuj.py" "$@"; fi
exec "${SD_VENV:-/home/user/sd/venv}/bin/python" "$(dirname "$0")/generuj.py" "$@"
