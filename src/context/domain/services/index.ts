import { Provider } from "@nestjs/common";

import { SecondFactorService } from "./second-factor.service";
import { CredentialService } from "./credential.service";
import { IdentifierService } from "./identifier.service";
import { AccountService } from "./account.service";
import { SessionService } from "./session.service";

export const SECOND_FACTOR_SERVICE = Symbol("Services.SecondFactor.Contract");
export const CREDENTIAL_SERVICE = Symbol("Services.Credential.Contract");
export const IDENTIFIER_SERVICE = Symbol("Services.Identifier.Contract");
export const ACCOUNT_SERVICE = Symbol("Services.Account.Contract");
export const SESSION_SERVICE = Symbol("Services.Session.Contract");

export const DOMAIN_SERVICES: Provider[] = [
    {
        provide: SECOND_FACTOR_SERVICE,
        useClass: SecondFactorService,
    },
    {
        provide: CREDENTIAL_SERVICE,
        useClass: CredentialService,
    },
    {
        provide: IDENTIFIER_SERVICE,
        useClass: IdentifierService,
    },
    {
        provide: ACCOUNT_SERVICE,
        useClass: AccountService,
    },
    {
        provide: SESSION_SERVICE,
        useClass: SessionService,
    },
];
