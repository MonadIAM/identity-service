import { AccountManageController } from "./manage-account.controller";
import { SecondFactorController } from "./second-factor.controller";
import { RecoveryCodeController } from "./recovery-code.controller";
import { IdentifierController } from "./identifier.controller";
import { ChangeLogController } from "./change-log.controller";
import { AuditLogController } from "./audit-log.controller";
import { PasswordController } from "./password.controller";
import { ProfileController } from "./profile.controller";
import { AccountController } from "./account.controller";
import { AuthnController } from "./authn.controller";
import { JWKSController } from "./jwks.controller";

export const HTTP_CONTROLLERS = [
    AccountManageController,
    SecondFactorController,
    RecoveryCodeController,
    IdentifierController,
    ChangeLogController,
    AuditLogController,
    PasswordController,
    ProfileController,
    AccountController,
    AuthnController,
    JWKSController,
];

export {
    AccountManageController,
    SecondFactorController,
    RecoveryCodeController,
    IdentifierController,
    ChangeLogController,
    AuditLogController,
    PasswordController,
    ProfileController,
    AccountController,
    AuthnController,
    JWKSController,
};
