declare namespace Unit.Domain.Session {
    interface Contract extends Core.Contract {
        service: Service.Signature;
    }

    namespace Service {
        type Props = {
            maxActiveSessions?: number;
            sessionExpiryDays?: string;
            account?: Entities.Account;
            accessTokenTTL?: string;
        };

        type Result = Core.Service.Context<Services.Session.Contract, { services: ServiceMocks.Contract }>;

        type Signature = (props?: Props) => Result;
    }
}
