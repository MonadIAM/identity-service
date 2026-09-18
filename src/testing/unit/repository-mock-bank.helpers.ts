import { jest } from "@jest/globals";

import { EntityFactoryRegistry } from "./entity-factory.registry";

export class RepositoryMockBank extends EntityFactoryRegistry implements Unit.Domain.RepositoryMockBank.Contract {
    public repositories(
        props: Unit.Domain.RepositoryMockBank.Repositories.Props = {},
    ): Unit.Domain.RepositoryMocks.Contract {
        const application = props.application ?? this.createApplication();
        const account = props.account ?? this.createAccount();

        return {
            applications: this.applicationRepository(application),
            passwordHistories: this.passwordHistoryRepository(),
            interfaceClients: this.interfaceClientRepository(),
            serviceClients: this.serviceClientRepository(),
            secondFactors: this.secondFactorRepository(),
            accounts: this.accountRepository(account),
            identifiers: this.identifierRepository(),
            changeLogs: this.changeLogRepository(),
            auditLogs: this.auditLogRepository(),
            sessions: this.sessionRepository(),
        };
    }

    private passwordHistoryRepository(): Unit.Domain.RepositoryMocks.Base {
        return {
            ...this.baseRepository("PasswordHistory"),
            find: jest.fn(() => Promise.resolve([])),
        };
    }

    private interfaceClientRepository(): Unit.Domain.RepositoryMocks.InterfaceClient {
        return {
            ...this.baseRepository("InterfaceClient"),
            wouldExceedApplicationLimit: jest.fn(() => Promise.resolve(false)),
            find: jest.fn(() => Promise.resolve([])),
        };
    }

    private serviceClientRepository(): Unit.Domain.RepositoryMocks.ServiceClient {
        return {
            ...this.baseRepository("ServiceClient"),
            wouldExceedApplicationLimit: jest.fn(() => Promise.resolve(false)),
            find: jest.fn(() => Promise.resolve([])),
        };
    }

    private secondFactorRepository(): Unit.Domain.RepositoryMocks.Base {
        return {
            ...this.baseRepository("SecondFactor"),
            findUnique: jest.fn(() => Promise.resolve(null)),
            find: jest.fn(() => Promise.resolve([])),
        };
    }

    private applicationRepository(application: Entities.Application): Unit.Domain.RepositoryMocks.Application {
        return {
            ...this.baseRepository("Application"),
            findUniqueOrThrow: jest.fn(() => Promise.resolve(application)),
            wouldExceedRealmLimit: jest.fn(() => Promise.resolve(false)),
            find: jest.fn(() => Promise.resolve([application])),
        };
    }

    private identifierRepository(): Unit.Domain.RepositoryMocks.Identifier {
        return {
            ...this.baseRepository("Identifier"),
            isLastVerifiedIdentifier: jest.fn(() => Promise.resolve(false)),
            find: jest.fn(() => Promise.resolve([])),
            getLookupList: jest.fn(),
        };
    }

    private changeLogRepository(): Unit.Domain.RepositoryMocks.Base {
        return {
            ...this.baseRepository("ChangeLog"),
            find: jest.fn(() => Promise.resolve([])),
        };
    }

    private auditLogRepository(): Unit.Domain.RepositoryMocks.Base {
        return {
            ...this.baseRepository("AuditLog"),
            find: jest.fn(() => Promise.resolve([])),
        };
    }

    private accountRepository(account: Entities.Account): Unit.Domain.RepositoryMocks.Account {
        return {
            ...this.baseRepository("Account"),
            findUniqueOrThrow: jest.fn(() => Promise.resolve(account)),
            find: jest.fn(() => Promise.resolve([account])),
            findExpiredInactive: jest.fn(),
            findExpiredPending: jest.fn(),
            getLookupList: jest.fn(),
        };
    }

    private sessionRepository(): Unit.Domain.RepositoryMocks.Session {
        return {
            ...this.baseRepository("Session"),
            lockByAccount: jest.fn(() => Promise.resolve([])),
            findUnique: jest.fn(() => Promise.resolve(null)),
            find: jest.fn(() => Promise.resolve([])),
        };
    }

    private baseRepository(resource: string): Unit.Domain.RepositoryMocks.Base {
        return {
            findUniqueOrThrow: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            find: jest.fn(),
            resource,
        };
    }
}
