#!/bin/sh
cd -- "$(dirname -- "$0")" || exit 1
/usr/bin/python3 setup_voice_key.py
printf '\nPress Return to close. '
read -r answer
