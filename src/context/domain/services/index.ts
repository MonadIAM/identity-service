import { ClassProvider } from "@nestjs/common";

import { InterfaceClientService } from "./interface-client.service";
import { ServiceClientService } from "./service-client.service";
import { RecoveryCodeService } from "./recovery-code.service";
import { SecondFactorService } from "./second-factor.service";
import { ApplicationService } from "./application.service";
import { MembershipService } from "./membership.service";
import { IdentifierService } from "./identifier.service";
import { ChangeLogService } from "./change-log.service";
import { AuditLogService } from "./audit-log.service";
import { PasswordService } from "./password.service";
import { AccountService } from "./account.service";
import { SessionService } from "./session.service";
import { ProfileService } from "./profile.service";
import {
    INTERFACE_CLIENT_SERVICE,
    SERVICE_CLIENT_SERVICE,
    SECOND_FACTOR_SERVICE,
    RECOVERY_CODE_SERVICE,
    APPLICATION_SERVICE,
    MEMBERSHIP_SERVICE,
    IDENTIFIER_SERVICE,
    CHANGE_LOG_SERVICE,
    AUDIT_LOG_SERVICE,
    PASSWORD_SERVICE,
    ACCOUNT_SERVICE,
    SESSION_SERVICE,
    PROFILE_SERVICE,
} from "./tokens";

export const DOMAIN_SERVICES: ClassProvider[] = [
    {
        provide: INTERFACE_CLIENT_SERVICE,
        useClass: InterfaceClientService,
    },
    {
        provide: SERVICE_CLIENT_SERVICE,
        useClass: ServiceClientService,
    },
    {
        provide: RECOVERY_CODE_SERVICE,
        useClass: RecoveryCodeService,
    },
    {
        provide: SECOND_FACTOR_SERVICE,
        useClass: SecondFactorService,
    },
    {
        provide: APPLICATION_SERVICE,
        useClass: ApplicationService,
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
        provide: CHANGE_LOG_SERVICE,
        useClass: ChangeLogService,
    },
    {
        provide: AUDIT_LOG_SERVICE,
        useClass: AuditLogService,
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
    INTERFACE_CLIENT_SERVICE,
    SERVICE_CLIENT_SERVICE,
    SECOND_FACTOR_SERVICE,
    RECOVERY_CODE_SERVICE,
    APPLICATION_SERVICE,
    MEMBERSHIP_SERVICE,
    IDENTIFIER_SERVICE,
    CHANGE_LOG_SERVICE,
    AUDIT_LOG_SERVICE,
    PASSWORD_SERVICE,
    ACCOUNT_SERVICE,
    SESSION_SERVICE,
    PROFILE_SERVICE,
};
