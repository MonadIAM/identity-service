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
import { InviteCommands } from "./invite.commands";
import { OAuthCommands } from "./oauth.commands";
import { AuthnCommands } from "./authn.commands";

export const REAUTHENTICATION_COMMANDS = Symbol("Commands.Reauthentication.Contract");
export const INTERFACE_CLIENT_COMMANDS = Symbol("Commands.InterfaceClient.Contract");
export const FEDERATED_AUTHN_COMMANDS = Symbol("Commands.FederatedAuthn.Contract");
export const SERVICE_CLIENT_COMMANDS = Symbol("Commands.ServiceClient.Contract");
export const RECOVERY_CODE_COMMANDS = Symbol("Commands.RecoveryCode.Contract");
export const SECOND_FACTOR_COMMANDS = Symbol("Commands.SecondFactor.Contract");
export const APPLICATION_COMMANDS = Symbol("Commands.Application.Contract");
export const MEMBERSHIP_COMMANDS = Symbol("Commands.Membership.Contract");
export const IDENTIFIER_COMMANDS = Symbol("Commands.Identifier.Contract");
export const PASSWORD_COMMANDS = Symbol("Commands.Password.Contract");
export const ACCOUNT_COMMANDS = Symbol("Commands.Account.Contract");
export const PROFILE_COMMANDS = Symbol("Commands.Profile.Contract");
export const SESSION_COMMANDS = Symbol("Commands.Session.Contract");
export const INVITE_COMMANDS = Symbol("Commands.Invite.Contract");
export const OAUTH_COMMANDS = Symbol("Commands.OAuth.Contract");
export const AUTHN_COMMANDS = Symbol("Commands.Authn.Contract");

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
        provide: INVITE_COMMANDS,
        useClass: InviteCommands,
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
