import { ClassProvider } from "@nestjs/common";

import { PasswordHistoryRepository } from "./password-history.repository";
import { InterfaceClientRepository } from "./interface-client.repository";
import { ServiceClientRepository } from "./service-client.repository";
import { RecoveryCodeRepository } from "./recovery-code.repository";
import { SecondFactorRepository } from "./second-factor.repository";
import { ApplicationRepository } from "./application.repository";
import { MasterCodeRepository } from "./master-code.repository";
import { IdentifierRepository } from "./identifier.repository";
import { ChangeLogRepository } from "./change-log.repository";
import { AuditLogRepository } from "./audit-log.repository";
import { PasswordRepository } from "./password.repository";
import { SessionRepository } from "./session.repository";
import { ProfileRepository } from "./profile.repository";
import { AccountRepository } from "./account.repository";
import {
    PASSWORD_HISTORY_REPOSITORY,
    INTERFACE_CLIENT_REPOSITORY,
    SERVICE_CLIENT_REPOSITORY,
    SECOND_FACTOR_REPOSITORY,
    RECOVERY_CODE_REPOSITORY,
    APPLICATION_REPOSITORY,
    MASTER_CODE_REPOSITORY,
    IDENTIFIER_REPOSITORY,
    CHANGE_LOG_REPOSITORY,
    AUDIT_LOG_REPOSITORY,
    PASSWORD_REPOSITORY,
    SESSION_REPOSITORY,
    PROFILE_REPOSITORY,
    ACCOUNT_REPOSITORY,
} from "./tokens";

export const REPOSITORIES: ClassProvider[] = [
    {
        provide: PASSWORD_HISTORY_REPOSITORY,
        useClass: PasswordHistoryRepository,
    },
    {
        provide: INTERFACE_CLIENT_REPOSITORY,
        useClass: InterfaceClientRepository,
    },
    {
        provide: SERVICE_CLIENT_REPOSITORY,
        useClass: ServiceClientRepository,
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
        provide: APPLICATION_REPOSITORY,
        useClass: ApplicationRepository,
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
        provide: CHANGE_LOG_REPOSITORY,
        useClass: ChangeLogRepository,
    },
    {
        provide: AUDIT_LOG_REPOSITORY,
        useClass: AuditLogRepository,
    },
    {
        provide: PASSWORD_REPOSITORY,
        useClass: PasswordRepository,
    },
    {
        provide: SESSION_REPOSITORY,
        useClass: SessionRepository,
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

export {
    PASSWORD_HISTORY_REPOSITORY,
    INTERFACE_CLIENT_REPOSITORY,
    SERVICE_CLIENT_REPOSITORY,
    SECOND_FACTOR_REPOSITORY,
    RECOVERY_CODE_REPOSITORY,
    APPLICATION_REPOSITORY,
    MASTER_CODE_REPOSITORY,
    IDENTIFIER_REPOSITORY,
    CHANGE_LOG_REPOSITORY,
    AUDIT_LOG_REPOSITORY,
    PASSWORD_REPOSITORY,
    SESSION_REPOSITORY,
    PROFILE_REPOSITORY,
    ACCOUNT_REPOSITORY,
};
