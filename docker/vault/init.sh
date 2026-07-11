#!/bin/sh
set -eu

echo "Waiting for Vault at $VAULT_ADDR..."
i=0
until vault status >/dev/null 2>&1; do
    i=$((i + 1))
    if [ "$i" -ge 60 ]; then
        echo "Vault did not become ready in time ($VAULT_ADDR)" >&2
        exit 1
    fi
    sleep 1
done

vault secrets list -format=json | grep -q "\"$VAULT_TRANSIT_MOUNT/\"" ||
    vault secrets enable -path="$VAULT_TRANSIT_MOUNT" transit

vault secrets list -format=json | grep -q "\"$VAULT_KV_MOUNT/\"" ||
    vault secrets enable -path="$VAULT_KV_MOUNT" -version=2 kv

vault read "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_ACCESS_KEY" >/dev/null 2>&1 ||
    vault write "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_ACCESS_KEY" type=ecdsa-p256

vault read "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_REFRESH_KEY" >/dev/null 2>&1 ||
    vault write "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_REFRESH_KEY" type=ecdsa-p256

vault read "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_ID_KEY" >/dev/null 2>&1 ||
    vault write "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_ID_KEY" type=ecdsa-p256

vault write "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_ACCESS_KEY/config" \
    auto_rotate_period="$VAULT_TRANSIT_ACCESS_ROTATION_PERIOD" \
    deletion_allowed=true

vault write "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_REFRESH_KEY/config" \
    auto_rotate_period="$VAULT_TRANSIT_REFRESH_ROTATION_PERIOD" \
    deletion_allowed=true

vault write "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_ID_KEY/config" \
    auto_rotate_period="$VAULT_TRANSIT_ID_ROTATION_PERIOD" \
    deletion_allowed=true

vault read "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_TOTP_KEY" >/dev/null 2>&1 ||
    vault write "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_TOTP_KEY" type=aes256-gcm96

vault write "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_TOTP_KEY/config" \
    auto_rotate_period="$VAULT_TRANSIT_TOTP_ROTATION_PERIOD"

vault read "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_PAIRWISE_KEY" >/dev/null 2>&1 ||
    vault write "$VAULT_TRANSIT_MOUNT/keys/$VAULT_TRANSIT_PAIRWISE_KEY" type=hmac key_size=32

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
    -e "s|{{id_key}}|$VAULT_TRANSIT_ID_KEY|g" \
    -e "s|{{totp_key}}|$VAULT_TRANSIT_TOTP_KEY|g" \
    -e "s|{{pairwise_key}}|$VAULT_TRANSIT_PAIRWISE_KEY|g" \
    /identity-service-policy.hcl > /tmp/identity-service-policy.hcl

vault policy write identity-service /tmp/identity-service-policy.hcl

sed \
    -e "s|{{mount}}|$VAULT_TRANSIT_MOUNT|g" \
    -e "s|{{access_key}}|$VAULT_TRANSIT_ACCESS_KEY|g" \
    -e "s|{{refresh_key}}|$VAULT_TRANSIT_REFRESH_KEY|g" \
    -e "s|{{id_key}}|$VAULT_TRANSIT_ID_KEY|g" \
    /key-trim-policy.hcl > /tmp/key-trim-policy.hcl

vault policy write vault-key-trim /tmp/key-trim-policy.hcl
vault token create \
    -field=token \
    -policy=vault-key-trim \
    -no-default-policy \
    -period=48h \
    > /vault/token/key-trim
chmod 0400 /vault/token/key-trim
vault token lookup "$VAULT_IDENTITY_TOKEN" >/dev/null 2>&1 ||
    vault token create -id="$VAULT_IDENTITY_TOKEN" -policy=identity-service -no-default-policy

sed \
    -e "s|{{kv_mount}}|$VAULT_KV_MOUNT|g" \
    -e "s|{{oauth_path}}|$VAULT_KV_OAUTH_PATH|g" \
    -e "s|{{runtime_path}}|$VAULT_KV_RUNTIME_PATH|g" \
    -e "s|{{replication_path}}|$VAULT_KV_REPLICATION_PATH|g" \
    /secrets-policy.hcl > /tmp/secrets-policy.hcl

vault policy write identity-service-secrets /tmp/secrets-policy.hcl
vault token create \
    -field=token \
    -policy=identity-service-secrets \
    -no-default-policy \
    -ttl=15m \
    -explicit-max-ttl=15m \
    > /vault/token/secrets
chmod 0400 /vault/token/secrets
