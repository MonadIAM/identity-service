CREATE ROLE identity_service_readonly NOLOGIN;

GRANT CONNECT ON DATABASE "identity-service" TO identity_service_readonly;
GRANT USAGE ON SCHEMA public TO identity_service_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO identity_service_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO identity_service_readonly;
