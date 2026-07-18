import { InterfaceClientManageController } from "./manage-interface-client.controller";
import { ServiceClientManageController } from "./manage-service-client.controller";
import { ApplicationManageController } from "./manage-application.controller";
import { IdentifierManageController } from "./manage-identifier.controller";
import { ChangeLogManageController } from "./manage-change-log.controller";
import { InterfaceClientController } from "./interface-client.controller";
import { AuditLogManageController } from "./manage-audit-log.controller";
import { FederatedAuthnController } from "./federated-authn.controller";
import { ServiceClientController } from "./service-client.controller";
import { AccountManageController } from "./manage-account.controller";
import { SecondFactorController } from "./second-factor.controller";
import { RecoveryCodeController } from "./recovery-code.controller";
import { ApplicationController } from "./application.controller";
import { IdentifierController } from "./identifier.controller";
import { DiscoveryController } from "./discovery.controller";
import { PasswordController } from "./password.controller";
import { ProfileController } from "./profile.controller";
import { AccountController } from "./account.controller";
import { AuthnController } from "./authn.controller";
import { OAuthController } from "./oauth.controller";

export const HTTP_CONTROLLERS = [
    InterfaceClientManageController,
    ServiceClientManageController,
    ApplicationManageController,
    IdentifierManageController,
    InterfaceClientController,
    ChangeLogManageController,
    AuditLogManageController,
    FederatedAuthnController,
    ServiceClientController,
    AccountManageController,
    SecondFactorController,
    RecoveryCodeController,
    ApplicationController,
    IdentifierController,
    DiscoveryController,
    PasswordController,
    ProfileController,
    AccountController,
    AuthnController,
    OAuthController,
];

export {
    InterfaceClientManageController,
    ServiceClientManageController,
    ApplicationManageController,
    IdentifierManageController,
    InterfaceClientController,
    ChangeLogManageController,
    AuditLogManageController,
    FederatedAuthnController,
    ServiceClientController,
    AccountManageController,
    SecondFactorController,
    RecoveryCodeController,
    ApplicationController,
    IdentifierController,
    DiscoveryController,
    PasswordController,
    ProfileController,
    AccountController,
    AuthnController,
    OAuthController,
};
