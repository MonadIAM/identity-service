#!/bin/sh
set -eu

i=0
until vault status >/dev/null 2>&1; do
    i=$((i + 1))
    if [ "$i" -ge 60 ]; then
        echo "Vault did not become ready in time ($VAULT_ADDR)" >&2
        exit 1
    fi
    sleep 1
done

i=0
while :; do
    if error_output="$(vault read -field=role_id auth/approle/role/identity-service-key-trim/role-id 2>&1 > /tmp/role-id)"; then
        break
    fi

    case "$error_output" in
        *"Code: 403"*|*"Code: 401"*)
            echo "Vault rejected VAULT_TOKEN while reading AppRole 'identity-service-key-trim': $error_output" >&2
            exit 1
            ;;
    esac

    i=$((i + 1))
    if [ "$i" -ge 120 ]; then
        echo "AppRole 'identity-service-key-trim' was never provisioned" >&2
        exit 1
    fi
    sleep 2
done

vault write -f -field=secret_id auth/approle/role/identity-service-key-trim/secret-id > /tmp/secret-id

export VAULT_TOKEN="$(vault write -field=token auth/approle/login \
    role_id="$(cat /tmp/role-id)" \
    secret_id="$(cat /tmp/secret-id)")"
rm -f /tmp/role-id /tmp/secret-id

echo "$VAULT_KEY_TRIM_SCHEDULE sh /trim-jwt-keys.sh >> /proc/1/fd/1 2>&1" > /etc/crontabs/root
exec crond -f -l 2
