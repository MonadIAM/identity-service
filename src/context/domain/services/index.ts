import { ClassProvider } from "@nestjs/common";

import { InterfaceClientService } from "./interface-client.service";
import { ServiceClientService } from "./service-client.service";
import { RecoveryCodeService } from "./recovery-code.service";
import { SecondFactorService } from "./second-factor.service";
import { OAuthClientService } from "./oauth-client.service";
import { ApplicationService } from "./application.service";
import { MembershipService } from "./membership.service";
import { IdentifierService } from "./identifier.service";
import { PasswordService } from "./password.service";
import { AccountService } from "./account.service";
import { SessionService } from "./session.service";
import { ProfileService } from "./profile.service";
import {
    RECOVERY_CODE_SERVICE,
    INTERFACE_CLIENT_SERVICE,
    SECOND_FACTOR_SERVICE,
    SERVICE_CLIENT_SERVICE,
    OAUTH_CLIENT_SERVICE,
    APPLICATION_SERVICE,
    MEMBERSHIP_SERVICE,
    IDENTIFIER_SERVICE,
    PASSWORD_SERVICE,
    ACCOUNT_SERVICE,
    SESSION_SERVICE,
    PROFILE_SERVICE,
} from "./tokens";

export const DOMAIN_SERVICES: ClassProvider[] = [
    {
        provide: RECOVERY_CODE_SERVICE,
        useClass: RecoveryCodeService,
    },
    {
        provide: SECOND_FACTOR_SERVICE,
        useClass: SecondFactorService,
    },
    {
        provide: OAUTH_CLIENT_SERVICE,
        useClass: OAuthClientService,
    },
    {
        provide: APPLICATION_SERVICE,
        useClass: ApplicationService,
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
        provide: MEMBERSHIP_SERVICE,
        useClass: MembershipService,
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

export {
    RECOVERY_CODE_SERVICE,
    INTERFACE_CLIENT_SERVICE,
    SECOND_FACTOR_SERVICE,
    SERVICE_CLIENT_SERVICE,
    OAUTH_CLIENT_SERVICE,
    APPLICATION_SERVICE,
    MEMBERSHIP_SERVICE,
    IDENTIFIER_SERVICE,
    PASSWORD_SERVICE,
    ACCOUNT_SERVICE,
    SESSION_SERVICE,
    PROFILE_SERVICE,
};
