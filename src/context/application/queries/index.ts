import { ClassProvider } from "@nestjs/common";

import { InterfaceClientQueries } from "./interface-client.queries";
import { ServiceClientQueries } from "./service-client.queries";
import { RecoveryCodeQueries } from "./recovery-code.queries";
import { SecondFactorQueries } from "./second-factor.queries";
import { OAuthClientQueries } from "./oauth-client.queries";
import { ApplicationQueries } from "./application.queries";
import { IdentifierQueries } from "./identifier.queries";
import { ChangeLogQueries } from "./change-log.queries";
import { AuditLogQueries } from "./audit-log.queries";
import { AccountQueries } from "./account.queries";
import { SessionQueries } from "./session.queries";
import { OAuthQueries } from "./oauth.queries";
import {
    INTERFACE_CLIENT_QUERIES,
    SERVICE_CLIENT_QUERIES,
    RECOVERY_CODE_QUERIES,
    SECOND_FACTOR_QUERIES,
    OAUTH_CLIENT_QUERIES,
    APPLICATION_QUERIES,
    IDENTIFIER_QUERIES,
    CHANGE_LOG_QUERIES,
    AUDIT_LOG_QUERIES,
    ACCOUNT_QUERIES,
    SESSION_QUERIES,
    OAUTH_QUERIES,
} from "./tokens";

export const QUERIES: ClassProvider[] = [
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
        provide: OAUTH_CLIENT_QUERIES,
        useClass: OAuthClientQueries,
    },
    {
        provide: APPLICATION_QUERIES,
        useClass: ApplicationQueries,
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
        provide: OAUTH_QUERIES,
        useClass: OAuthQueries,
    },
];

export {
    INTERFACE_CLIENT_QUERIES,
    SERVICE_CLIENT_QUERIES,
    RECOVERY_CODE_QUERIES,
    SECOND_FACTOR_QUERIES,
    OAUTH_CLIENT_QUERIES,
    APPLICATION_QUERIES,
    IDENTIFIER_QUERIES,
    CHANGE_LOG_QUERIES,
    AUDIT_LOG_QUERIES,
    ACCOUNT_QUERIES,
    SESSION_QUERIES,
    OAUTH_QUERIES,
};
