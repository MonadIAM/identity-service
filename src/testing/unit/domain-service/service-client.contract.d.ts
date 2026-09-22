declare namespace Unit.Domain.ServiceClient {
    interface Contract extends Core.Contract {
        service: Service.Signature;
    }
    namespace Service {
        type Props = {
            account?: Entities.Account;
        };

        type Result = Core.Service.Context<Services.ServiceClient.Contract>;

        type Signature = (props?: Props) => Result;
    }
}
