declare namespace Unit.Domain.Identifier {
    interface Contract extends Core.Contract {
        service: Service.Signature;
    }

    namespace Service {
        type Props = {
            account?: Entities.Account;
        };

        type Result = Core.Service.Context<Services.Identifier.Contract>;

        type Signature = (props?: Props) => Result;
    }
}
