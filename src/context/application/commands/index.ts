import { Provider } from "@nestjs/common";

import { ElevatedAccessCommands } from "./elevated-access.commands";
import { RecoveryCodeCommands } from "./recovery-code.commands";
import { SecondFactorCommands } from "./second-factor.commands";
import { MembershipCommands } from "./membership.commands";
import { IdentifierCommands } from "./identifier.commands";
import { PasswordCommands } from "./password.commands";
import { AccountCommands } from "./account.commands";
import { ProfileCommands } from "./profile.commands";
import { SessionCommands } from "./session.commands";
import { OAuthCommands } from "./oauth.commands";
import { AuthCommands } from "./auth.commands";
import {
    ELEVATED_ACCESS_COMMANDS,
    RECOVERY_CODE_COMMANDS,
    SECOND_FACTOR_COMMANDS,
    MEMBERSHIP_COMMANDS,
    IDENTIFIER_COMMANDS,
    PASSWORD_COMMANDS,
    ACCOUNT_COMMANDS,
    PROFILE_COMMANDS,
    SESSION_COMMANDS,
    OAUTH_COMMANDS,
    AUTH_COMMANDS,
} from "./tokens";

export const COMMANDS: Provider[] = [
    {
        provide: ELEVATED_ACCESS_COMMANDS,
        useClass: ElevatedAccessCommands,
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
        provide: AUTH_COMMANDS,
        useClass: AuthCommands,
    },
];

export {
    ELEVATED_ACCESS_COMMANDS,
    RECOVERY_CODE_COMMANDS,
    SECOND_FACTOR_COMMANDS,
    MEMBERSHIP_COMMANDS,
    IDENTIFIER_COMMANDS,
    PASSWORD_COMMANDS,
    ACCOUNT_COMMANDS,
    PROFILE_COMMANDS,
    SESSION_COMMANDS,
    OAUTH_COMMANDS,
    AUTH_COMMANDS,
};
