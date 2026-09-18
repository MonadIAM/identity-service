declare namespace Unit {
    namespace Domain {
        namespace RepositoryMockBank {
            interface Contract extends EntityFactory.Contract {
                readonly repositories: Repositories.Signature;
            }

            namespace Repositories {
                type Props = {
                    readonly application?: Entities.Application;
                    readonly account?: Entities.Account;
                };

                type Result = RepositoryMocks.Contract;

                type Signature = (props?: Props) => Result;
            }
        }

        namespace RepositoryMocks {
            type Base = {
                resource: string;

                findUniqueOrThrow: Mock;
                findUnique: Mock;
                findMany: Mock;
                find: Mock;
            };

            type Account = Base & {
                findExpiredInactive: Mock;
                findExpiredPending: Mock;
                getLookupList: Mock;
            };

            type Application = Base & {
                wouldExceedRealmLimit: Mock;
            };

            type Identifier = Base & {
                isLastVerifiedIdentifier: Mock;
                getLookupList: Mock;
            };

            type InterfaceClient = Base & {
                wouldExceedApplicationLimit: Mock;
            };

            type ServiceClient = Base & {
                wouldExceedApplicationLimit: Mock;
            };

            type Session = Base & {
                lockByAccount: Mock;
            };

            interface Contract {
                readonly interfaceClients: InterfaceClient;
                readonly serviceClients: ServiceClient;
                readonly applications: Application;
                readonly passwordHistories: Base;
                readonly identifiers: Identifier;
                readonly secondFactors: Base;
                readonly accounts: Account;
                readonly sessions: Session;
                readonly changeLogs: Base;
                readonly auditLogs: Base;
            }
        }
    }
}
