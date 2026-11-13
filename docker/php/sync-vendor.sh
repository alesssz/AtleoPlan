#!/bin/sh
# =============================================================================
# AtleoPlan — sync-vendor: copies the Composer packages from the container to
# the computer, for the editor.
#
# Why it exists (docs/how-to/H2-backend.md H2.18, docs/concepts/C2-backend.md C2.4):
# in development the packages, `backend/vendor/`, live in a Docker volume
# inside Docker's Linux virtual machine, not in the folder shared with the
# computer. A request reads about a thousand package files, and through the
# shared folder that cost over a second after every pause; from the volume
# it costs nothing. But the editor (VS Code) runs on the computer and wants
# the packages too, to complete Laravel's classes and open their source. So
# this script keeps a copy of them in the computer's `backend/vendor/`, which
# compose.yaml mounts in the container at /vendor-host.
#
# Who runs it:
# - Composer, by itself, after every install, require, update, remove and
#   dump-autoload: the `post-autoload-dump` scripts in backend/composer.json
#   end with it;
# - `make vendor`, by hand, when the copy is missing or was touched.
#
# Where it lives: the Dockerfile's `dev` target copies it into the image as
# /usr/local/bin/sync-vendor, a folder on the PATH, so `sync-vendor` alone
# runs it. A change to this file therefore needs `make build`.
#
# The copy on the computer is for reading only: the app never uses it, and a
# change made there is overwritten by the next copy.
# =============================================================================
#
# The first line, the "shebang" (#!), tells the system which program runs this
# file: /bin/sh, the basic shell every Linux image has. It must be the very
# first bytes of the file, and end with LF, not CRLF: with CRLF the system
# looks for a program called "/bin/sh\r", which does not exist. The project's
# .gitattributes keeps *.sh files in LF on Windows for this reason.

# Shell options for the whole script:
# -e  stop at the first command that fails, instead of going on as if it had
#     worked; Composer then sees the failure and reports it;
# -u  stop when a variable is used without having been set, which is almost
#     always a typo in its name.
set -eu

# Where compose.yaml mounts the computer's backend/vendor/. A shell variable is
# set with NAME=value (no spaces around =) and read with $NAME, written
# "$NAME" in double quotes so a value with spaces stays one word.
MIRROR=/vendor-host

# [ ... ] is the shell's test command: -d asks "is this a folder?", and ! turns
# the answer around. So: if /vendor-host is not a folder, the container is not
# the development one (a future production image, a CI run), there is no
# computer to copy to, and the script ends at once. `exit 0` means success, so
# Composer goes on normally; any other number would mean failure.
if [ ! -d "$MIRROR" ]; then
    exit 0
fi

echo "Copying vendor/ to the computer, for the editor (only what changed)..."

# The time now, in seconds since 1970 (`date +%s`); $( ... ) runs a command and
# puts its output in place, here into the variable.
START=$(date +%s)

# rsync copies a folder onto another, and sends only the files that differ:
# by default it compares each file's size and modification date. After a
# `composer require`, only the new package travels, not all 17,000 files.
# -r          into every sub-folder (recursive);
# -l          a symbolic link is copied as a link, not as the file it points to;
# -t          keep each file's modification date, which the next run compares:
#             without it every file would look changed every time;
# --delete    remove from the copy what no longer exists here, such as a
#             package after `composer remove`.
# The / at the end of the source copies what is inside the folder; without it
# rsync would create /vendor-host/vendor/.
# Not -a ("archive", the usual choice): it also copies owners and permissions,
# which a folder shared with Windows or macOS cannot always take.
rsync -rlt --delete /app/vendor/ "$MIRROR/"

# $(( ... )) is the shell's arithmetic: now minus the start, in seconds.
echo "vendor/ copied in $(( $(date +%s) - START )) s."
