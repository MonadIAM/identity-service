declare namespace Unit.Domain.SecondFactor {
    interface Contract extends Core.Contract {
        service: Service.Signature;
    }

    namespace Service {
        type Props = {
            account?: Entities.Account;
        };

        type Result = Core.Service.Context<Services.SecondFactor.Contract, { services: ServiceMocks.Contract }>;

        type Signature = (props?: Props) => Result;
    }
}
