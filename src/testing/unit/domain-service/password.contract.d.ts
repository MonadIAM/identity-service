declare namespace Unit.Domain.Password {
    interface Contract extends Core.Contract {
        service: Service.Signature;
    }

    namespace Service {
        type Props = {
            account?: Entities.Account;
            historyCheckDays?: string;
        };

        type Result = Core.Service.Context<Services.Password.Contract, { services: ServiceMocks.Contract }>;

        type Signature = (props?: Props) => Result;
    }
}
