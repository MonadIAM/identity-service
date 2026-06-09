#!/bin/sh
set -eu

trim_key() {
    key="$1"
    retain="$2"
    latest=$(vault read -field=latest_version "$VAULT_TRANSIT_MOUNT/keys/$key")
    min=$(( latest > retain ? latest - retain + 1 : 1 ))
    vault write "$VAULT_TRANSIT_MOUNT/keys/$key/config" \
        min_decryption_version="$min" \
        min_encryption_version="$min"
    vault write "$VAULT_TRANSIT_MOUNT/keys/$key/trim" min_available_version="$min"
}

vault token renew -self >/dev/null

trim_key "$VAULT_TRANSIT_ACCESS_KEY" "$VAULT_TRANSIT_ACCESS_RETAIN_VERSIONS"
trim_key "$VAULT_TRANSIT_REFRESH_KEY" "$VAULT_TRANSIT_REFRESH_RETAIN_VERSIONS"
