import { ClassProvider } from "@nestjs/common";

import { MembershipHistoryService } from "./membership-history.service";
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
import { InviteService } from "./invite.service";

export const MEMBERSHIP_HISTORY_SERVICE = Symbol("Services.MembershipHistory.Contract");
export const INTERFACE_CLIENT_SERVICE = Symbol("Services.InterfaceClient.Contract");
export const SERVICE_CLIENT_SERVICE = Symbol("Services.ServiceClient.Contract");
export const SECOND_FACTOR_SERVICE = Symbol("Services.SecondFactor.Contract");
export const RECOVERY_CODE_SERVICE = Symbol("Services.RecoveryCode.Contract");
export const APPLICATION_SERVICE = Symbol("Services.Application.Contract");
export const MEMBERSHIP_SERVICE = Symbol("Services.Membership.Contract");
export const IDENTIFIER_SERVICE = Symbol("Services.Identifier.Contract");
export const CHANGE_LOG_SERVICE = Symbol("Services.ChangeLog.Contract");
export const AUDIT_LOG_SERVICE = Symbol("Services.AuditLog.Contract");
export const PASSWORD_SERVICE = Symbol("Services.Password.Contract");
export const ACCOUNT_SERVICE = Symbol("Services.Account.Contract");
export const SESSION_SERVICE = Symbol("Services.Session.Contract");
export const PROFILE_SERVICE = Symbol("Services.Profile.Contract");
export const INVITE_SERVICE = Symbol("Services.Invite.Contract");

export const DOMAIN_SERVICES: ClassProvider[] = [
    {
        provide: MEMBERSHIP_HISTORY_SERVICE,
        useClass: MembershipHistoryService,
    },
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
    {
        provide: INVITE_SERVICE,
        useClass: InviteService,
    },
];
