import { Provider } from "@nestjs/common";

import { AccountService } from "./account.service";

export const ACCOUNT_SERVICE = Symbol("Services.Account.Contract");

export const DOMAIN_SERVICES: Provider[] = [
    {
        provide: ACCOUNT_SERVICE,
        useClass: AccountService,
    },
];
