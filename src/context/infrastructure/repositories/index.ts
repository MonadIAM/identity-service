import { Provider } from "@nestjs/common";

import { IdentifierRepository } from "./identifier.repository";
import { AccountRepository } from "./account.repository";

export const IDENTIFIER_REPOSITORY = Symbol("Repositories.Identifier.Contract");
export const ACCOUNT_REPOSITORY = Symbol("Repositories.Account.Contract");

export const REPOSITORIES: Provider[] = [
    {
        provide: IDENTIFIER_REPOSITORY,
        useClass: IdentifierRepository,
    },
    {
        provide: ACCOUNT_REPOSITORY,
        useClass: AccountRepository,
    },
];
