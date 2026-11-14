#!/bin/sh
# Copies the container's vendor/ to the computer's backend/vendor/, for the
# editor. In development the packages live in a volume, which the editor on the
# computer cannot see; compose.yaml mounts the computer's folder at
# /vendor-host.
#
# Run by Composer after every change (`post-autoload-dump` in
# backend/composer.json) and by `make vendor`. The copy is read-only for the
# app: changes made there are overwritten.

set -eu

MIRROR=/vendor-host

# Not the development container (CI, a production image): nothing to do
if [ ! -d "$MIRROR" ]; then
    exit 0
fi

echo "Copying vendor/ to the computer, for the editor (only what changed)..."

START=$(date +%s)

# -t keeps modification dates, which the next run compares to send only what
# changed. Not -a: owners and permissions do not survive a folder shared with
# Windows or macOS.
rsync -rlt --delete /app/vendor/ "$MIRROR/"

echo "vendor/ copied in $(( $(date +%s) - START )) s."
