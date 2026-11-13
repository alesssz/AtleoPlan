# syntax=docker/dockerfile:1

# AtleoPlan — image of the Laravel backend: the API, the Filament admin panel
# and the queue worker all run from it.
#
# FrankenPHP is PHP built into the Caddy web server: one container answers HTTP
# and runs PHP, with no Nginx + PHP-FPM pair to wire together
# (docs/design/D2-decisions.md D2.6).
#
# Targets:
# - `dev`  development, used by compose.yaml; the code is not copied in but
#          mounted from ./backend, so every change is live.
# - `prod` not written yet: it comes with the deployment (docs/project/backlog.md OPS-3)
#          and will also build the React app into the image.

# FrankenPHP 1.x with PHP 8.4, on Debian bookworm.
ARG FRANKENPHP_VERSION=1
ARG PHP_VERSION=8.4

# --- Base: what every environment needs ---------------------------------------
FROM dunglas/frankenphp:${FRANKENPHP_VERSION}-php${PHP_VERSION}-bookworm AS base

# System packages:
# - ffmpeg      converts uploaded videos to 720p H.264 without audio and
#               extracts their poster image (docs/design/D2-decisions.md D2.5)
# - git, unzip  Composer needs them to download and unpack packages
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg git unzip \
 && rm -rf /var/lib/apt/lists/*

# PHP extensions, through install-php-extensions (shipped with the image):
# - pdo_pgsql  the Postgres database driver
# - intl       number and date formats per language (82,5 kg / 82.5 kg);
#              Filament requires it too
# - zip        Composer and Filament's exports
# - gd, exif   photo resizing to WebP and thumbnails, reading the camera's
#              orientation (spatie/laravel-medialibrary)
# - pcntl      lets queue workers finish the current job before stopping
# - opcache    keeps compiled PHP in memory
RUN install-php-extensions pdo_pgsql intl zip gd exif pcntl opcache

# Composer, copied from its official image instead of installed by script.
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Composer's download cache in a fixed place, so compose.yaml can keep it in a
# volume and `composer install` does not download everything again.
ENV COMPOSER_CACHE_DIR=/composer-cache

# The Laravel app lives in /app; FrankenPHP's default Caddyfile serves /app/public.
WORKDIR /app

# --- Development ---------------------------------------------------------------
FROM base AS dev

# PHP's own development settings (errors shown in full, no output buffering),
# then ours on top: upload limits and memory (docker/php/dev.ini).
RUN cp "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"
COPY docker/php/dev.ini "$PHP_INI_DIR/conf.d/zz-atleoplan.ini"

# The Composer packages: in development they live in a Docker volume, not in
# the folder shared with the computer, because reading a thousand files
# through that folder made every request after a pause take over a second
# (compose.yaml, docs/how-to/H2-backend.md H2.18). After every Composer change,
# sync-vendor copies them to the computer's backend/vendor/ for the editor.
#
# rsync makes that copy, sending only the files that changed. It is installed
# here, in the `dev` target, and not in `base` with the other packages: only
# development has a computer to copy to, and a future production image does
# not need it. Its own RUN, after the lines above, so the layers built before
# it stay in Docker's build cache.
# - apt-get update                 downloads the list of available packages
# - --no-install-recommends        installs rsync alone, without the extras
#                                  Debian suggests with it
# - rm -rf /var/lib/apt/lists/*    deletes that list again: the image stays
#                                  smaller, and it would be stale anyway
RUN apt-get update \
 && apt-get install -y --no-install-recommends rsync \
 && rm -rf /var/lib/apt/lists/*

# The script itself, into /usr/local/bin: a folder on the PATH, so the command
# `sync-vendor` alone runs it, from Composer or from `make vendor`.
# --chmod=755 makes it executable (owner: read, write, run; others: read,
# run), whatever permissions the file has on the computer; Windows has no
# such permissions at all. A change to the script needs `make build`.
COPY --chmod=755 docker/php/sync-vendor.sh /usr/local/bin/sync-vendor

# Plain HTTP on port 8000. With a name such as `localhost` Caddy would create
# HTTPS certificates, which local development does not need.
ENV SERVER_NAME=:8000
EXPOSE 8000

# No CMD: the image's default runs FrankenPHP in classic mode, where every
# request reads the PHP files again, so code changes apply at once.
