path "{{mount}}/keys/{{access_key}}" {
  capabilities = ["read"]
}

path "{{mount}}/keys/{{refresh_key}}" {
  capabilities = ["read"]
}

path "{{mount}}/sign/{{access_key}}" {
  capabilities = ["update"]
}

path "{{mount}}/sign/{{refresh_key}}" {
  capabilities = ["update"]
}

path "{{mount}}/encrypt/{{totp_key}}" {
  capabilities = ["update"]
}

path "{{mount}}/decrypt/{{totp_key}}" {
  capabilities = ["update"]
}

path "{{kv_mount}}/data/{{oauth_path}}" {
  capabilities = ["read"]
}

path "{{kv_mount}}/data/{{runtime_path}}" {
  capabilities = ["read"]
}
