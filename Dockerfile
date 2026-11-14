# syntax=docker/dockerfile:1

# The Laravel backend's image: the API, the admin panel and the queue worker.
# FrankenPHP serves HTTP and runs PHP in one container.
#
# Targets:
# - `dev`  used by compose.yaml; the code is mounted from ./backend, not copied.
# - `prod` comes with the deployment, and will also build the React app into the
#   image.

ARG FRANKENPHP_VERSION=1
ARG PHP_VERSION=8.4

# --- Base ------------------------------------------------------------------------
FROM dunglas/frankenphp:${FRANKENPHP_VERSION}-php${PHP_VERSION}-bookworm AS base

# - ffmpeg      video conversion and posters
# - git, unzip  for Composer
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg git unzip \
 && rm -rf /var/lib/apt/lists/*

# - intl       per-language number and date formats; Filament requires it
# - gd, exif   photo conversions and camera orientation (medialibrary)
# - pcntl      lets queue workers finish the current job before stopping
RUN install-php-extensions pdo_pgsql intl zip gd exif pcntl opcache

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# A fixed place, so compose.yaml can keep the download cache in a volume
ENV COMPOSER_CACHE_DIR=/composer-cache

WORKDIR /app

# --- Development -----------------------------------------------------------------
FROM base AS dev

RUN cp "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"
COPY docker/php/dev.ini "$PHP_INI_DIR/conf.d/zz-atleoplan.ini"

# vendor/ lives in a volume, not in the folder shared with the computer: reading
# it through that folder cost over a second per request after a pause.
# sync-vendor copies it to the computer for the editor; rsync is only needed
# here, not in `base`.
RUN apt-get update \
 && apt-get install -y --no-install-recommends rsync \
 && rm -rf /var/lib/apt/lists/*

# Executable whatever the file's mode on the computer (Windows has none). A
# change to the script needs `make build`.
COPY --chmod=755 docker/php/sync-vendor.sh /usr/local/bin/sync-vendor

# Plain HTTP: with a host name Caddy would create HTTPS certificates
ENV SERVER_NAME=:8000
EXPOSE 8000

# No CMD: the default classic mode re-reads PHP files on every request, so
# code changes apply at once.
