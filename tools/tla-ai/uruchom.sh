#!/bin/sh
# Uruchamia generuj.py w venv z tools/portrety-ai; torch z PyPI bez bibliotek CUDA działa na procesorze dzięki atrapom w venv/stub.
V=$(dirname "$0")/../portrety-ai/venv
LD_PRELOAD=$V/stub/libcuextra.so LD_LIBRARY_PATH=$V/stub exec "$V/bin/python" "$(dirname "$0")/generuj.py" "$@"
