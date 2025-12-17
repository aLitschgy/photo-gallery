#!/bin/sh
set -e

if [ -n "$CUSTOM_SCRIPT" ]; then
  sed "s|<!-- custom-script-placeholder -->|${CUSTOM_SCRIPT}|g" public/index.html > public/index.html.tmp && mv public/index.html.tmp public/index.html
fi

exec "$@"
