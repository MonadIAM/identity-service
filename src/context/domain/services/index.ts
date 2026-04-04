import { Provider } from "@nestjs/common";

import { RecoveryCodeService } from "./recovery-code.service";
import { SecondFactorService } from "./second-factor.service";
import { IdentifierService } from "./identifier.service";
import { PasswordService } from "./password.service";
import { AccountService } from "./account.service";
import { SessionService } from "./session.service";
import { ProfileService } from "./profile.service";

export const RECOVERY_CODE_SERVICE = Symbol("Services.RecoveryCode.Contract");
export const SECOND_FACTOR_SERVICE = Symbol("Services.SecondFactor.Contract");
export const IDENTIFIER_SERVICE = Symbol("Services.Identifier.Contract");
export const PASSWORD_SERVICE = Symbol("Services.Password.Contract");
export const ACCOUNT_SERVICE = Symbol("Services.Account.Contract");
export const SESSION_SERVICE = Symbol("Services.Session.Contract");
export const PROFILE_SERVICE = Symbol("Services.Profile.Contract");

export const DOMAIN_SERVICES: Provider[] = [
    {
        provide: RECOVERY_CODE_SERVICE,
        useClass: RecoveryCodeService,
    },
    {
        provide: SECOND_FACTOR_SERVICE,
        useClass: SecondFactorService,
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
