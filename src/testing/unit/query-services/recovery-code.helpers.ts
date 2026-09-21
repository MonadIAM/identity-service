import { jest } from "@jest/globals";

import { RecoveryCodeQueries } from "~context/application/queries/recovery-code.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class RecoveryCodeQueriesUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Application.RecoveryCodeQueries.Contract
{
    public queries(): Unit.Application.RecoveryCodeQueries.Queries.Result {
        const recoveryCodeRepository = {
            getStatus: jest.fn<Repositories.RecoveryCode.QueryContract["getStatus"]>(),
        };

        return {
            recoveryCodeRepository,
            queries: new RecoveryCodeQueries(
                this.contract<Repositories.RecoveryCode.QueryContract>(recoveryCodeRepository),
            ),
        };
    }
}
