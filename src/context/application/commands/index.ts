import { ClassProvider } from "@nestjs/common";

import { ReauthenticationCommands } from "./reauthentication.commands";
import { InterfaceClientCommands } from "./interface-client.commands";
import { FederatedAuthnCommands } from "./federated-authn.commands";
import { ServiceClientCommands } from "./service-client.commands";
import { RecoveryCodeCommands } from "./recovery-code.commands";
import { SecondFactorCommands } from "./second-factor.commands";
import { ApplicationCommands } from "./application.commands";
import { MembershipCommands } from "./membership.commands";
import { IdentifierCommands } from "./identifier.commands";
import { PasswordCommands } from "./password.commands";
import { AccountCommands } from "./account.commands";
import { ProfileCommands } from "./profile.commands";
import { SessionCommands } from "./session.commands";
import { OAuthCommands } from "./oauth.commands";
import { AuthnCommands } from "./authn.commands";
import {
    REAUTHENTICATION_COMMANDS,
    INTERFACE_CLIENT_COMMANDS,
    FEDERATED_AUTHN_COMMANDS,
    SERVICE_CLIENT_COMMANDS,
    RECOVERY_CODE_COMMANDS,
    SECOND_FACTOR_COMMANDS,
    APPLICATION_COMMANDS,
    MEMBERSHIP_COMMANDS,
    IDENTIFIER_COMMANDS,
    PASSWORD_COMMANDS,
    ACCOUNT_COMMANDS,
    PROFILE_COMMANDS,
    SESSION_COMMANDS,
    OAUTH_COMMANDS,
    AUTHN_COMMANDS,
} from "./tokens";

export const COMMANDS: ClassProvider[] = [
    {
        provide: REAUTHENTICATION_COMMANDS,
        useClass: ReauthenticationCommands,
    },
    {
        provide: INTERFACE_CLIENT_COMMANDS,
        useClass: InterfaceClientCommands,
    },
    {
        provide: FEDERATED_AUTHN_COMMANDS,
        useClass: FederatedAuthnCommands,
    },
    {
        provide: SERVICE_CLIENT_COMMANDS,
        useClass: ServiceClientCommands,
    },
    {
        provide: RECOVERY_CODE_COMMANDS,
        useClass: RecoveryCodeCommands,
    },
    {
        provide: SECOND_FACTOR_COMMANDS,
        useClass: SecondFactorCommands,
    },
    {
        provide: APPLICATION_COMMANDS,
        useClass: ApplicationCommands,
    },
    {
        provide: MEMBERSHIP_COMMANDS,
        useClass: MembershipCommands,
    },
    {
        provide: IDENTIFIER_COMMANDS,
        useClass: IdentifierCommands,
    },
    {
        provide: PASSWORD_COMMANDS,
        useClass: PasswordCommands,
    },
    {
        provide: ACCOUNT_COMMANDS,
        useClass: AccountCommands,
    },
    {
        provide: PROFILE_COMMANDS,
        useClass: ProfileCommands,
    },
    {
        provide: SESSION_COMMANDS,
        useClass: SessionCommands,
    },
    {
        provide: OAUTH_COMMANDS,
        useClass: OAuthCommands,
    },
    {
        provide: AUTHN_COMMANDS,
        useClass: AuthnCommands,
    },
];

export {
    REAUTHENTICATION_COMMANDS,
    INTERFACE_CLIENT_COMMANDS,
    FEDERATED_AUTHN_COMMANDS,
    SERVICE_CLIENT_COMMANDS,
    RECOVERY_CODE_COMMANDS,
    SECOND_FACTOR_COMMANDS,
    APPLICATION_COMMANDS,
    MEMBERSHIP_COMMANDS,
    IDENTIFIER_COMMANDS,
    PASSWORD_COMMANDS,
    ACCOUNT_COMMANDS,
    PROFILE_COMMANDS,
    SESSION_COMMANDS,
    OAUTH_COMMANDS,
    AUTHN_COMMANDS,
};
