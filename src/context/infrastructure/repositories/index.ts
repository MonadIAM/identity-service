import { Provider } from "@nestjs/common";

import { AccountRepository } from "./account.repository";

export const ACCOUNT_REPOSITORY = Symbol("Repositories.Account.Contract");

export const REPOSITORIES: Provider[] = [
    {
        provide: ACCOUNT_REPOSITORY,
        useClass: AccountRepository,
    },
];
