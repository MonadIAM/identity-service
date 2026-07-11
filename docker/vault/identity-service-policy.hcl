path "{{mount}}/keys/{{access_key}}" {
  capabilities = ["read"]
}

path "{{mount}}/keys/{{refresh_key}}" {
  capabilities = ["read"]
}

path "{{mount}}/keys/{{id_key}}" {
  capabilities = ["read"]
}

path "{{mount}}/keys/{{totp_key}}" {
  capabilities = ["read"]
}

path "{{mount}}/sign/{{access_key}}" {
  capabilities = ["update"]
}

path "{{mount}}/sign/{{refresh_key}}" {
  capabilities = ["update"]
}

path "{{mount}}/sign/{{id_key}}" {
  capabilities = ["update"]
}

path "{{mount}}/encrypt/{{totp_key}}" {
  capabilities = ["update"]
}

path "{{mount}}/decrypt/{{totp_key}}" {
  capabilities = ["update"]
}

path "{{mount}}/rewrap/{{totp_key}}" {
  capabilities = ["update"]
}

path "{{mount}}/hmac/{{pairwise_key}}" {
  capabilities = ["update"]
}
