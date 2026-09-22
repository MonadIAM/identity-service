import { jest } from "@jest/globals";

import { RecoveryCodeQueries } from "~context/application/queries/recovery-code.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class RecoveryCodeQueriesUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Queries.RecoveryCode.Contract
{
    public queries(): Unit.Queries.RecoveryCode.Queries.Result {
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
