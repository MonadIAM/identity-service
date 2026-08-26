import { ClassProvider } from "@nestjs/common";

import { MembershipHistoryQueries } from "./membership-history.queries";
import { InterfaceClientQueries } from "./interface-client.queries";
import { ServiceClientQueries } from "./service-client.queries";
import { RecoveryCodeQueries } from "./recovery-code.queries";
import { SecondFactorQueries } from "./second-factor.queries";
import { ApplicationQueries } from "./application.queries";
import { MembershipQueries } from "./membership.queries";
import { IdentifierQueries } from "./identifier.queries";
import { ChangeLogQueries } from "./change-log.queries";
import { AuditLogQueries } from "./audit-log.queries";
import { AccountQueries } from "./account.queries";
import { SessionQueries } from "./session.queries";
import { InviteQueries } from "./invite.queries";
import { OAuthQueries } from "./oauth.queries";

export const MEMBERSHIP_HISTORY_QUERIES = Symbol("Queries.MembershipHistory.Contract");
export const INTERFACE_CLIENT_QUERIES = Symbol("Queries.InterfaceClient.Contract");
export const SERVICE_CLIENT_QUERIES = Symbol("Queries.ServiceClient.Contract");
export const RECOVERY_CODE_QUERIES = Symbol("Queries.RecoveryCode.Contract");
export const SECOND_FACTOR_QUERIES = Symbol("Queries.SecondFactor.Contract");
export const APPLICATION_QUERIES = Symbol("Queries.Application.Contract");
export const MEMBERSHIP_QUERIES = Symbol("Queries.Membership.Contract");
export const IDENTIFIER_QUERIES = Symbol("Queries.Identifier.Contract");
export const CHANGE_LOG_QUERIES = Symbol("Queries.ChangeLog.Contract");
export const AUDIT_LOG_QUERIES = Symbol("Queries.AuditLog.Contract");
export const ACCOUNT_QUERIES = Symbol("Queries.Account.Contract");
export const SESSION_QUERIES = Symbol("Queries.Session.Contract");
export const INVITE_QUERIES = Symbol("Queries.Invite.Contract");
export const OAUTH_QUERIES = Symbol("Queries.OAuth.Contract");

export const QUERIES: ClassProvider[] = [
    {
        provide: MEMBERSHIP_HISTORY_QUERIES,
        useClass: MembershipHistoryQueries,
    },
    {
        provide: INTERFACE_CLIENT_QUERIES,
        useClass: InterfaceClientQueries,
    },
    {
        provide: SERVICE_CLIENT_QUERIES,
        useClass: ServiceClientQueries,
    },
    {
        provide: RECOVERY_CODE_QUERIES,
        useClass: RecoveryCodeQueries,
    },
    {
        provide: SECOND_FACTOR_QUERIES,
        useClass: SecondFactorQueries,
    },
    {
        provide: APPLICATION_QUERIES,
        useClass: ApplicationQueries,
    },
    {
        provide: MEMBERSHIP_QUERIES,
        useClass: MembershipQueries,
    },
    {
        provide: IDENTIFIER_QUERIES,
        useClass: IdentifierQueries,
    },
    {
        provide: CHANGE_LOG_QUERIES,
        useClass: ChangeLogQueries,
    },
    {
        provide: AUDIT_LOG_QUERIES,
        useClass: AuditLogQueries,
    },
    {
        provide: ACCOUNT_QUERIES,
        useClass: AccountQueries,
    },
    {
        provide: SESSION_QUERIES,
        useClass: SessionQueries,
    },
    {
        provide: INVITE_QUERIES,
        useClass: InviteQueries,
    },
    {
        provide: OAUTH_QUERIES,
        useClass: OAuthQueries,
    },
];
