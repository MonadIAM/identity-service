#!/bin/sh
set -eu

export VAULT_TOKEN="$(cat /vault/token/key-trim)"

echo "$VAULT_KEY_TRIM_SCHEDULE sh /trim-keys.sh >> /proc/1/fd/1 2>&1" > /etc/crontabs/root
exec crond -f -l 2
