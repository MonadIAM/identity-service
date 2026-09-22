declare namespace Unit.Domain.ChangeLog {
    interface Contract extends Core.Contract {
        service: Service.Signature;
    }

    namespace Service {
        type Props = {
            account?: Entities.Account;
        };

        type Result = Core.Service.Context<Services.ChangeLog.Contract>;

        type Signature = (props?: Props) => Result;
    }
}
