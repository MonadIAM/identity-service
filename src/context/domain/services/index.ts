import { Provider } from "@nestjs/common";

import { IdentifierService } from "./identifier.service";
import { AccountService } from "./account.service";

export const IDENTIFIER_SERVICE = Symbol("Services.Identifier.Contract");
export const ACCOUNT_SERVICE = Symbol("Services.Account.Contract");

export const DOMAIN_SERVICES: Provider[] = [
    {
        provide: IDENTIFIER_SERVICE,
        useClass: IdentifierService,
    },
    {
        provide: ACCOUNT_SERVICE,
        useClass: AccountService,
    },
];
