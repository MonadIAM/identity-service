path "{{mount}}/keys/{{access_key}}" {
  capabilities = ["read"]
}

path "{{mount}}/keys/{{refresh_key}}" {
  capabilities = ["read"]
}

path "{{mount}}/keys/{{access_key}}/config" {
  capabilities = ["update"]
}

path "{{mount}}/keys/{{refresh_key}}/config" {
  capabilities = ["update"]
}

path "{{mount}}/keys/{{access_key}}/trim" {
  capabilities = ["update"]
}

path "{{mount}}/keys/{{refresh_key}}/trim" {
  capabilities = ["update"]
}

path "auth/token/renew-self" {
  capabilities = ["update"]
}
