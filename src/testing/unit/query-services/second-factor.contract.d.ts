declare namespace Unit.Queries.SecondFactor {
    interface Contract extends Unit.Commands.Core.Contract {
        queries: Queries.Signature;
    }

    namespace Queries {
        type Result = Promise<
            Unit.Commands.Core.Execution.Result & {
                totpService: Jest.Mocked<Pick<CommonServices.TOTP.PublicContract, "createURI">>;
                queries: globalThis.Queries.SecondFactor.Contract;
                secondFactorRepository: {
                    findMany: Jest.Mock<Repositories.SecondFactor.QueryContract["findMany"]>;
                    findUnique: Jest.Mock<Repositories.SecondFactor.QueryContract["findUnique"]>;
                };
                secondFactorSecretService: Jest.Mocked<
                    Pick<InfrastructureServices.SecondFactorSecret.PublicContract, "resolve">
                >;
            }
        >;

        type Signature = () => Result;
    }
}
