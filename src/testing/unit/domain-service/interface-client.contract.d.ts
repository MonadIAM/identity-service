declare namespace Unit.Domain.InterfaceClient {
    interface Contract extends Core.Contract {
        service: Service.Signature;
    }

    namespace Service {
        type Props = {
            account?: Entities.Account;
            redirectUriLimit?: number;
        };

        type Result = Core.Service.Context<Services.InterfaceClient.Contract>;

        type Signature = (props?: Props) => Result;
    }
}
