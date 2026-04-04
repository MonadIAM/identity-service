import { Provider } from "@nestjs/common";

import { SecondFactorCommands } from "./second-factor.commands";
import { IdentifierCommands } from "./identifier.commands";
import { PasswordCommands } from "./password.commands";
import { AccountCommands } from "./account.commands";
import { ProfileCommands } from "./profile.commands";
import { SessionCommands } from "./session.commands";
import { OAuthCommands } from "./oauth.commands";

export const SECOND_FACTOR_COMMANDS = Symbol("Commands.SecondFactor.Contract");
export const IDENTIFIER_COMMANDS = Symbol("Commands.Identifier.Contract");
export const PASSWORD_COMMANDS = Symbol("Commands.Password.Contract");
export const ACCOUNT_COMMANDS = Symbol("Commands.Account.Contract");
export const PROFILE_COMMANDS = Symbol("Commands.Profile.Contract");
export const SESSION_COMMANDS = Symbol("Commands.Session.Contract");
export const OAUTH_COMMANDS = Symbol("Commands.OAuth.Contract");

export const COMMANDS: Provider[] = [
    {
        provide: SECOND_FACTOR_COMMANDS,
        useClass: SecondFactorCommands,
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
];
