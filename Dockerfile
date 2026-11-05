# syntax=docker/dockerfile:1

# AtleoPlan — image of the Laravel backend: the API, the Filament admin panel
# and the queue worker all run from it.
#
# FrankenPHP is PHP built into the Caddy web server: one container answers HTTP
# and runs PHP, with no Nginx + PHP-FPM pair to wire together
# (docs/02-decisions.md 2.6).
#
# Targets:
# - `dev`  development, used by compose.yaml; the code is not copied in but
#          mounted from ./backend, so every change is live.
# - `prod` not written yet: it comes with the deployment (docs/backlog.md OPS-3)
#          and will also build the React app into the image.

# FrankenPHP 1.x with PHP 8.4, on Debian bookworm.
ARG FRANKENPHP_VERSION=1
ARG PHP_VERSION=8.4

# --- Base: what every environment needs ---------------------------------------
FROM dunglas/frankenphp:${FRANKENPHP_VERSION}-php${PHP_VERSION}-bookworm AS base

# System packages:
# - ffmpeg      converts uploaded videos to 720p H.264 without audio and
#               extracts their poster image (docs/02-decisions.md 2.5)
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

# Plain HTTP on port 8000. With a name such as `localhost` Caddy would create
# HTTPS certificates, which local development does not need.
ENV SERVER_NAME=:8000
EXPOSE 8000

# No CMD: the image's default runs FrankenPHP in classic mode, where every
# request reads the PHP files again, so code changes apply at once.
