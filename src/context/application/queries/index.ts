import { Provider } from "@nestjs/common";

import { RecoveryCodeQueries } from "./recovery-code.queries";
import { SecondFactorQueries } from "./second-factor.queries";
import { IdentifierQueries } from "./identifier.queries";
import { ChangeLogQueries } from "./change-log.queries";
import { AuditLogQueries } from "./audit-log.queries";
import { AccountQueries } from "./account.queries";
import { SessionQueries } from "./session.queries";

export const RECOVERY_CODE_QUERIES = Symbol("Queries.RecoveryCode.Contract");
export const SECOND_FACTOR_QUERIES = Symbol("Queries.SecondFactor.Contract");
export const IDENTIFIER_QUERIES = Symbol("Queries.Identifier.Contract");
export const CHANGE_LOG_QUERIES = Symbol("Queries.ChangeLog.Contract");
export const AUDIT_LOG_QUERIES = Symbol("Queries.AuditLog.Contract");
export const ACCOUNT_QUERIES = Symbol("Queries.Account.Contract");
export const SESSION_QUERIES = Symbol("Queries.Session.Contract");

export const QUERIES: Provider[] = [
    {
        provide: RECOVERY_CODE_QUERIES,
        useClass: RecoveryCodeQueries,
    },
    {
        provide: SECOND_FACTOR_QUERIES,
        useClass: SecondFactorQueries,
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
];
