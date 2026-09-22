declare namespace Unit.Queries.RecoveryCode {
    interface Contract extends Domain.Core.Contract {
        queries: Queries.Signature;
    }

    namespace Queries {
        type Result = {
            queries: globalThis.Queries.RecoveryCode.Contract;
            recoveryCodeRepository: {
                getStatus: Jest.Mock<Repositories.RecoveryCode.QueryContract["getStatus"]>;
            };
        };

        type Signature = () => Result;
    }
}
