#!/bin/sh
set -eu

export REDIS_PASSWORD="$(cat /vault/secrets/redis_password)"
export POSTGRES_PASSWORD="$(cat /vault/secrets/postgresql_password)"
export OAUTH_GOOGLE_CLIENT_SECRET="$(cat /vault/secrets/google_client_secret)"
export OAUTH_GITHUB_CLIENT_SECRET="$(cat /vault/secrets/github_client_secret)"

exec node dist/src/main.js
