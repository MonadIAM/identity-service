declare namespace Unit.Domain.AuditLog {
    interface Contract extends Core.Contract {
        service: Service.Signature;
    }

    namespace Service {
        type Props = {
            account?: Entities.Account;
        };

        type Result = Core.Service.Context<Services.AuditLog.Contract>;

        type Signature = (props?: Props) => Result;
    }
}
