import { ClassProvider } from "@nestjs/common";

import { MembershipHistoryRepository } from "./membership-history.repository";
import { PasswordHistoryRepository } from "./password-history.repository";
import { InterfaceClientRepository } from "./interface-client.repository";
import { ServiceClientRepository } from "./service-client.repository";
import { RecoveryCodeRepository } from "./recovery-code.repository";
import { SecondFactorRepository } from "./second-factor.repository";
import { ApplicationRepository } from "./application.repository";
import { MasterCodeRepository } from "./master-code.repository";
import { MembershipRepository } from "./membership.repository";
import { IdentifierRepository } from "./identifier.repository";
import { ChangeLogRepository } from "./change-log.repository";
import { AuditLogRepository } from "./audit-log.repository";
import { PasswordRepository } from "./password.repository";
import { SessionRepository } from "./session.repository";
import { ProfileRepository } from "./profile.repository";
import { AccountRepository } from "./account.repository";
import { InviteRepository } from "./invite.repository";

export const MEMBERSHIP_HISTORY_REPOSITORY = Symbol("Repositories.MembershipHistory.Contract");
export const PASSWORD_HISTORY_REPOSITORY = Symbol("Repositories.PasswordHistory.Contract");
export const INTERFACE_CLIENT_REPOSITORY = Symbol("Repositories.InterfaceClient.Contract");
export const SERVICE_CLIENT_REPOSITORY = Symbol("Repositories.ServiceClient.Contract");
export const SECOND_FACTOR_REPOSITORY = Symbol("Repositories.SecondFactor.Contract");
export const RECOVERY_CODE_REPOSITORY = Symbol("Repositories.RecoveryCode.Contract");
export const APPLICATION_REPOSITORY = Symbol("Repositories.Application.Contract");
export const MASTER_CODE_REPOSITORY = Symbol("Repositories.MasterCode.Contract");
export const MEMBERSHIP_REPOSITORY = Symbol("Repositories.Membership.Contract");
export const IDENTIFIER_REPOSITORY = Symbol("Repositories.Identifier.Contract");
export const CHANGE_LOG_REPOSITORY = Symbol("Repositories.ChangeLog.Contract");
export const AUDIT_LOG_REPOSITORY = Symbol("Repositories.AuditLog.Contract");
export const PASSWORD_REPOSITORY = Symbol("Repositories.Password.Contract");
export const SESSION_REPOSITORY = Symbol("Repositories.Session.Contract");
export const PROFILE_REPOSITORY = Symbol("Repositories.Profile.Contract");
export const ACCOUNT_REPOSITORY = Symbol("Repositories.Account.Contract");
export const INVITE_REPOSITORY = Symbol("Repositories.Invite.Contract");

export const REPOSITORIES: ClassProvider[] = [
    {
        provide: MEMBERSHIP_HISTORY_REPOSITORY,
        useClass: MembershipHistoryRepository,
    },
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
        provide: MEMBERSHIP_REPOSITORY,
        useClass: MembershipRepository,
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
    {
        provide: INVITE_REPOSITORY,
        useClass: InviteRepository,
    },
];
