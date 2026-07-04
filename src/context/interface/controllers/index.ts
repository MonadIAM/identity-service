import { AuthzServerMetadataController } from "./authz-server-metadata.controller";
import { OAuthClientManageController } from "./manage-oauth-client.controller";
import { IdentifierManageController } from "./manage-identifier.controller";
import { ChangeLogManageController } from "./manage-change-log.controller";
import { AuditLogManageController } from "./manage-audit-log.controller";
import { FederatedAuthnController } from "./federated-authn.controller";
import { AccountManageController } from "./manage-account.controller";
import { SecondFactorController } from "./second-factor.controller";
import { RecoveryCodeController } from "./recovery-code.controller";
import { OAuthClientController } from "./oauth-client.controller";
import { IdentifierController } from "./identifier.controller";
import { PasswordController } from "./password.controller";
import { ProfileController } from "./profile.controller";
import { AccountController } from "./account.controller";
import { AuthnController } from "./authn.controller";
import { OAuthController } from "./oauth.controller";
import { JWKSController } from "./jwks.controller";

export const HTTP_CONTROLLERS = [
    AuthzServerMetadataController,
    OAuthClientManageController,
    IdentifierManageController,
    ChangeLogManageController,
    AuditLogManageController,
    FederatedAuthnController,
    AccountManageController,
    SecondFactorController,
    RecoveryCodeController,
    OAuthClientController,
    IdentifierController,
    PasswordController,
    ProfileController,
    AccountController,
    AuthnController,
    OAuthController,
    JWKSController,
];

export {
    AuthzServerMetadataController,
    OAuthClientManageController,
    IdentifierManageController,
    ChangeLogManageController,
    AuditLogManageController,
    FederatedAuthnController,
    AccountManageController,
    SecondFactorController,
    RecoveryCodeController,
    OAuthClientController,
    IdentifierController,
    PasswordController,
    ProfileController,
    AccountController,
    AuthnController,
    OAuthController,
    JWKSController,
};
