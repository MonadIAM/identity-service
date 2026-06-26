import { ClassProvider } from "@nestjs/common";

import { RecoveryCodeService } from "./recovery-code.service";
import { SecondFactorService } from "./second-factor.service";
import { OAuthClientService } from "./oauth-client.service";
import { MembershipService } from "./membership.service";
import { IdentifierService } from "./identifier.service";
import { PasswordService } from "./password.service";
import { AccountService } from "./account.service";
import { SessionService } from "./session.service";
import { ProfileService } from "./profile.service";
import {
    RECOVERY_CODE_SERVICE,
    SECOND_FACTOR_SERVICE,
    OAUTH_CLIENT_SERVICE,
    MEMBERSHIP_SERVICE,
    IDENTIFIER_SERVICE,
    PASSWORD_SERVICE,
    ACCOUNT_SERVICE,
    SESSION_SERVICE,
    PROFILE_SERVICE,
} from "./tokens";

export const DOMAIN_SERVICES: ClassProvider[] = [
    {
        provide: RECOVERY_CODE_SERVICE,
        useClass: RecoveryCodeService,
    },
    {
        provide: SECOND_FACTOR_SERVICE,
        useClass: SecondFactorService,
    },
    {
        provide: OAUTH_CLIENT_SERVICE,
        useClass: OAuthClientService,
    },
    {
        provide: MEMBERSHIP_SERVICE,
        useClass: MembershipService,
    },
    {
        provide: IDENTIFIER_SERVICE,
        useClass: IdentifierService,
    },
    {
        provide: PASSWORD_SERVICE,
        useClass: PasswordService,
    },
    {
        provide: ACCOUNT_SERVICE,
        useClass: AccountService,
    },
    {
        provide: SESSION_SERVICE,
        useClass: SessionService,
    },
    {
        provide: PROFILE_SERVICE,
        useClass: ProfileService,
    },
];

export {
    RECOVERY_CODE_SERVICE,
    SECOND_FACTOR_SERVICE,
    OAUTH_CLIENT_SERVICE,
    MEMBERSHIP_SERVICE,
    IDENTIFIER_SERVICE,
    PASSWORD_SERVICE,
    ACCOUNT_SERVICE,
    SESSION_SERVICE,
    PROFILE_SERVICE,
};
