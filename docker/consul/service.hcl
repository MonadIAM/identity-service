service {
    name    = "identity-service"
    id      = "identity-service"
    address = "identity-service-connect"
    port    = 5001

    connect {
        sidecar_service {
            address = "identity-service-connect"
            port    = 21001

            proxy {
                local_service_address = "127.0.0.1"
                local_service_port    = 5001

                config {
                    bind_address = "0.0.0.0"
                    bind_port    = 21001
                }

                upstreams = [
                    {
                        destination_name   = "access-control-service"
                        local_bind_address = "127.0.0.1"
                        local_bind_port    = 15051
                    }
                ]
            }
        }
    }
}
