import { Provider } from "@nestjs/common";

import { PasswordHistoryRepository } from "./password-history.repository";
import { RecoveryCodeRepository } from "./recovery-code.repository";
import { SecondFactorRepository } from "./second-factor.repository";
import { NotificationRepository } from "./notification.repository";
import { MasterCodeRepository } from "./master-code.repository";
import { IdentifierRepository } from "./identifier.repository";
import { PasswordRepository } from "./password.repository";
import { ProfileRepository } from "./profile.repository";
import { AccountRepository } from "./account.repository";

export const PASSWORD_HISTORY_REPOSITORY = Symbol("Repositories.PasswordHistory.Contract");
export const RECOVERY_CODE_REPOSITORY = Symbol("Repositories.RecoveryCode.Contract");
export const SECOND_FACTOR_REPOSITORY = Symbol("Repositories.SecondFactor.Contract");
export const NOTIFICATION_REPOSITORY = Symbol("Repositories.Notification.Contract");
export const MASTER_CODE_REPOSITORY = Symbol("Repositories.MasterCode.Contract");
export const IDENTIFIER_REPOSITORY = Symbol("Repositories.Identifier.Contract");
export const PASSWORD_REPOSITORY = Symbol("Repositories.Password.Contract");
export const PROFILE_REPOSITORY = Symbol("Repositories.Profile.Contract");
export const ACCOUNT_REPOSITORY = Symbol("Repositories.Account.Contract");

export const REPOSITORIES: Provider[] = [
    {
        provide: PASSWORD_HISTORY_REPOSITORY,
        useClass: PasswordHistoryRepository,
    },
    {
        provide: RECOVERY_CODE_REPOSITORY,
        useClass: RecoveryCodeRepository,
    },
    {
        provide: SECOND_FACTOR_REPOSITORY,
        useClass: SecondFactorRepository,
    },
    {
        provide: NOTIFICATION_REPOSITORY,
        useClass: NotificationRepository,
    },
    {
        provide: MASTER_CODE_REPOSITORY,
        useClass: MasterCodeRepository,
    },
    {
        provide: IDENTIFIER_REPOSITORY,
        useClass: IdentifierRepository,
    },
    {
        provide: PASSWORD_REPOSITORY,
        useClass: PasswordRepository,
    },
    {
        provide: PROFILE_REPOSITORY,
        useClass: ProfileRepository,
    },
    {
        provide: ACCOUNT_REPOSITORY,
        useClass: AccountRepository,
    },
];
