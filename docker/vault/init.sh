#!/bin/sh
set -eu

vault secrets list -format=json | grep -q "\"$VAULT_TRANSIT_MOUNT/\"" ||
    vault secrets enable -path="$VAULT_TRANSIT_MOUNT" transit

vault secrets list -format=json | grep -q "\"$VAULT_KV_MOUNT/\"" ||
    vault secrets enable -path="$VAULT_KV_MOUNT" -version=2 kv

vault read "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_ACCESS_KEY" >/dev/null 2>&1 ||
    vault write "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_ACCESS_KEY" type=ecdsa-p256

vault read "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_REFRESH_KEY" >/dev/null 2>&1 ||
    vault write "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_REFRESH_KEY" type=ecdsa-p256

vault write "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_ACCESS_KEY/config" \
    auto_rotate_period="$VAULT_TRANSIT_ACCESS_ROTATION_PERIOD"

vault write "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_REFRESH_KEY/config" \
    auto_rotate_period="$VAULT_TRANSIT_REFRESH_ROTATION_PERIOD"

vault read "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_TOTP_KEY" >/dev/null 2>&1 ||
    vault write "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_TOTP_KEY" type=aes256-gcm96

vault write "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_TOTP_KEY/config" \
    auto_rotate_period="$VAULT_TRANSIT_TOTP_ROTATION_PERIOD"

vault kv get "$VAULT_KV_MOUNT/$VAULT_KV_OAUTH_PATH" >/dev/null 2>&1 ||
    vault kv put "$VAULT_KV_MOUNT/$VAULT_KV_OAUTH_PATH" \
        google_client_secret="$OAUTH_GOOGLE_CLIENT_SECRET" \
        github_client_secret="$OAUTH_GITHUB_CLIENT_SECRET"

vault kv get "$VAULT_KV_MOUNT/$VAULT_KV_RUNTIME_PATH" >/dev/null 2>&1 ||
    vault kv put "$VAULT_KV_MOUNT/$VAULT_KV_RUNTIME_PATH" \
        postgresql_password="$POSTGRES_PASSWORD" \
        redis_password="$REDIS_PASSWORD"

vault kv get "$VAULT_KV_MOUNT/$VAULT_KV_REPLICATION_PATH" >/dev/null 2>&1 ||
    vault kv put "$VAULT_KV_MOUNT/$VAULT_KV_REPLICATION_PATH" \
        postgresql_replication_password="$POSTGRES_REPLICATION_PASSWORD"

sed \
    -e "s|{{mount}}|$VAULT_TRANSIT_MOUNT|g" \
    -e "s|{{access_key}}|$VAULT_TRANSIT_ACCESS_KEY|g" \
    -e "s|{{refresh_key}}|$VAULT_TRANSIT_REFRESH_KEY|g" \
    -e "s|{{totp_key}}|$VAULT_TRANSIT_TOTP_KEY|g" \
    -e "s|{{kv_mount}}|$VAULT_KV_MOUNT|g" \
    -e "s|{{oauth_path}}|$VAULT_KV_OAUTH_PATH|g" \
    -e "s|{{runtime_path}}|$VAULT_KV_RUNTIME_PATH|g" \
    /identity-service-policy.hcl > /tmp/identity-service-policy.hcl

vault policy write identity-service /tmp/identity-service-policy.hcl
vault token lookup "$VAULT_IDENTITY_TOKEN" >/dev/null 2>&1 ||
    vault token create -id="$VAULT_IDENTITY_TOKEN" -policy=identity-service -no-default-policy
