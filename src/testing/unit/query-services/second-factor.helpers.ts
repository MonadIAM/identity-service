import { jest } from "@jest/globals";

import { ApplicationCommandUnitHelpers } from "../command-services/core.helpers";

export class SecondFactorQueriesUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Application.SecondFactorQueries.Contract
{
    public async queries(): Unit.Application.SecondFactorQueries.Queries.Result {
        const { SecondFactorQueries } = await import("~context/application/queries/second-factor.queries.js");
        const execution = this.execution();

        const secondFactorSecretService = {
            resolve: jest.fn<InfrastructureServices.SecondFactorSecret.PublicContract["resolve"]>(),
        };
        const secondFactorRepository = {
            findUnique: jest.fn<Repositories.SecondFactor.QueryContract["findUnique"]>(),
            findMany: jest.fn<Repositories.SecondFactor.QueryContract["findMany"]>(),
        };
        const totpService = {
            createURI: jest.fn<CommonServices.TOTP.PublicContract["createURI"]>(),
        };

        return {
            ...execution,
            secondFactorSecretService,
            secondFactorRepository,
            totpService,
            queries: new SecondFactorQueries(
                this.contract<TransactionManager.Service.Contract>(execution.transactional),
                this.contract<Repositories.SecondFactor.QueryContract>(secondFactorRepository),
                this.contract<InfrastructureServices.SecondFactorSecret.PublicContract>(secondFactorSecretService),
                this.contract<CommonServices.TOTP.PublicContract>(totpService),
            ),
        };
    }
}
