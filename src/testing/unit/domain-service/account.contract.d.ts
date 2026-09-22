declare namespace Unit.Domain.Account {
    interface Contract extends Core.Contract {
        service: Service.Signature;
    }

    namespace Service {
        type Props = {
            account?: Entities.Account;
        };

        type Result = Core.Service.Context<Services.Account.Contract>;

        type Signature = (props?: Props) => Result;
    }
}
