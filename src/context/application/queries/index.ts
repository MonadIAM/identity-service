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
import {
    MEMBERSHIP_HISTORY_QUERIES,
    INTERFACE_CLIENT_QUERIES,
    SERVICE_CLIENT_QUERIES,
    RECOVERY_CODE_QUERIES,
    SECOND_FACTOR_QUERIES,
    APPLICATION_QUERIES,
    MEMBERSHIP_QUERIES,
    IDENTIFIER_QUERIES,
    CHANGE_LOG_QUERIES,
    AUDIT_LOG_QUERIES,
    ACCOUNT_QUERIES,
    SESSION_QUERIES,
    INVITE_QUERIES,
    OAUTH_QUERIES,
} from "./tokens";

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

export {
    MEMBERSHIP_HISTORY_QUERIES,
    INTERFACE_CLIENT_QUERIES,
    SERVICE_CLIENT_QUERIES,
    RECOVERY_CODE_QUERIES,
    SECOND_FACTOR_QUERIES,
    APPLICATION_QUERIES,
    MEMBERSHIP_QUERIES,
    IDENTIFIER_QUERIES,
    CHANGE_LOG_QUERIES,
    AUDIT_LOG_QUERIES,
    ACCOUNT_QUERIES,
    SESSION_QUERIES,
    INVITE_QUERIES,
    OAUTH_QUERIES,
};
