declare namespace Unit.Domain {
    namespace RepositoryMockBank {
        interface Contract extends Testing.EntityFactory.Contract {
            repositories: Repositories.Signature;
        }

        namespace Repositories {
            type Props = {
                account?: Entities.Account;
            };

            type Result = RepositoryMocks.Contract;

            type Signature = (props?: Props) => Result;
        }
    }

    namespace RepositoryMocks {
        type Base = {
            resource: string;

            findUniqueOrThrow: Jest.Mock;
            findUnique: Jest.Mock;
            findMany: Jest.Mock;
            find: Jest.Mock;
        };

        type Account = Base & {
            findExpiredInactive: Jest.Mock;
            findExpiredPending: Jest.Mock;
            getLookupList: Jest.Mock;
        };

        type Identifier = Base & {
            isLastVerifiedIdentifier: Jest.Mock;
            getLookupList: Jest.Mock;
        };

        type InterfaceClient = Base & {
            wouldExceedRealmLimit: Jest.Mock;
        };

        type ServiceClient = Base & {
            wouldExceedRealmLimit: Jest.Mock;
        };

        type Session = Base & {
            lockByAccount: Jest.Mock;
        };

        interface Contract {
            interfaceClients: InterfaceClient;
            serviceClients: ServiceClient;
            passwordHistories: Base;
            identifiers: Identifier;
            secondFactors: Base;
            accounts: Account;
            sessions: Session;
            changeLogs: Base;
            auditLogs: Base;
        }
    }
}
