import { jest } from "@jest/globals";

import { AccountQueries } from "~context/application/queries/account.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class AccountQueriesUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Application.AccountQueries.Contract
{
    public queries(): Unit.Application.AccountQueries.Queries.Result {
        const accountRepository = {
            findUniqueOrThrow: jest.fn<Repositories.Account.QueryContract["findUniqueOrThrow"]>(),
            findMany: jest.fn<Repositories.Account.QueryContract["findMany"]>(),
        };

        return {
            accountRepository,
            queries: new AccountQueries(this.contract<Repositories.Account.QueryContract>(accountRepository)),
        };
    }
}
