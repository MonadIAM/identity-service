declare namespace Unit.Domain.Profile {
    interface Contract extends Core.Contract {
        service: Service.Signature;
    }

    namespace Service {
        type Props = {
            account?: Entities.Account;
        };

        type Result = Core.Service.Context<Services.Profile.Contract>;

        type Signature = (props?: Props) => Result;
    }
}
