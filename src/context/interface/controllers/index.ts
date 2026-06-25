import { AuthzServerMetadataController } from "./authz-server-metadata.controller";
import { IdentifierManageController } from "./manage-identifier.controller";
import { ChangeLogManageController } from "./manage-change-log.controller";
import { AuditLogManageController } from "./manage-audit-log.controller";
import { FederatedAuthnController } from "./federated-authn.controller";
import { AccountManageController } from "./manage-account.controller";
import { SecondFactorController } from "./second-factor.controller";
import { RecoveryCodeController } from "./recovery-code.controller";
import { IdentifierController } from "./identifier.controller";
import { PasswordController } from "./password.controller";
import { ProfileController } from "./profile.controller";
import { AccountController } from "./account.controller";
import { AuthnController } from "./authn.controller";
import { OAuthController } from "./oauth.controller";
import { JWKSController } from "./jwks.controller";

export const HTTP_CONTROLLERS = [
    AuthzServerMetadataController,
    IdentifierManageController,
    ChangeLogManageController,
    AuditLogManageController,
    FederatedAuthnController,
    AccountManageController,
    SecondFactorController,
    RecoveryCodeController,
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
    IdentifierManageController,
    ChangeLogManageController,
    AuditLogManageController,
    FederatedAuthnController,
    AccountManageController,
    SecondFactorController,
    RecoveryCodeController,
    IdentifierController,
    PasswordController,
    ProfileController,
    AccountController,
    AuthnController,
    OAuthController,
    JWKSController,
};
