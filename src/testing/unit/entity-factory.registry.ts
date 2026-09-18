import { ChangeSetType, Collection } from "@mikro-orm/core";

import { AuditLog, ChangeLog } from "~common/transaction-manager/entities";
import {
    PasswordHistory,
    InterfaceClient,
    ServiceClient,
    RecoveryCode,
    SecondFactor,
    Application,
    MasterCode,
    Identifier,
    Password,
    Session,
    Profile,
    Account,
} from "~context/domain/entities";
import { SecondFactorType, IdentifierType, TokenGrantType, AccountSubject, AccountStatus } from "~context/enums";

export class EntityFactoryRegistry implements Unit.Domain.EntityFactory.Contract {
    public createAccount(props: Unit.Domain.EntityFactory.CreateAccount.Props = {}): Entities.Account {
        return this.entity(
            new Account({
                subject: AccountSubject.HUMAN,
                status: AccountStatus.ACTIVE,
            }),
            props,
        );
    }

    public createProfile(props: Unit.Domain.EntityFactory.CreateProfile.Props = {}): Entities.Profile {
        return this.entity(
            new Profile({
                account: this.createAccount(),
                displayName: "Unit Account",
            }),
            props,
        );
    }

    public createIdentifier(props: Unit.Domain.EntityFactory.CreateIdentifier.Props = {}): Entities.Identifier {
        return this.entity(
            new Identifier({
                account: this.createAccount(),
                identity: "unit@example.com",
                type: IdentifierType.EMAIL,
            }),
            props,
        );
    }

    public createPassword(props: Unit.Domain.EntityFactory.CreatePassword.Props = {}): Entities.Password {
        return this.entity(
            new Password({
                account: this.createAccount(),
                hash: "unit-password-hash",
            }),
            props,
        );
    }

    public createPasswordHistory(
        props: Unit.Domain.EntityFactory.CreatePasswordHistory.Props = {},
    ): Entities.PasswordHistory {
        return this.entity(
            new PasswordHistory({
                account: this.createAccount(),
                hash: "unit-previous-hash",
                version: 1,
            }),
            props,
        );
    }

    public createRecoveryCode(props: Unit.Domain.EntityFactory.CreateRecoveryCode.Props = {}): Entities.RecoveryCode {
        return this.entity(
            new RecoveryCode({
                account: this.createAccount(),
                hash: "unit-recovery-hash",
            }),
            props,
        );
    }

    public createMasterCode(props: Unit.Domain.EntityFactory.CreateMasterCode.Props = {}): Entities.MasterCode {
        return this.entity(
            new MasterCode({
                account: this.createAccount(),
                hash: "unit-master-hash",
            }),
            props,
        );
    }

    public createSecondFactor(props: Unit.Domain.EntityFactory.CreateSecondFactor.Props = {}): Entities.SecondFactor {
        return this.entity(
            new SecondFactor({
                account: this.createAccount(),
                type: SecondFactorType.TOTP,
                secret: "unit-secret",
                name: "Unit Factor",
            }),
            props,
        );
    }

    public createSession(props: Unit.Domain.EntityFactory.CreateSession.Props = {}): Entities.Session {
        return this.entity(
            new Session({
                expiresAt: new Date("2999-01-01T00:00:00.000Z"),
                account: this.createAccount(),
                userAgent: "unit-agent",
                client: "unit-client",
                scope: "openid",
                ip: "127.0.0.1",
                realms: [],
                acr: "1",
            }),
            props,
        );
    }

    public createApplication(props: Unit.Domain.EntityFactory.CreateApplication.Props = {}): Entities.Application {
        return this.entity(
            new Application({
                realm: "00000000-0000-4000-8000-0000000000ff",
                name: "Unit Application",
            }),
            props,
        );
    }

    public createInterfaceClient(
        props: Unit.Domain.EntityFactory.CreateInterfaceClient.Props = {},
    ): Entities.InterfaceClient {
        return this.entity(
            new InterfaceClient({
                grantTypes: [TokenGrantType.AUTHORIZATION_CODE, TokenGrantType.REFRESH_TOKEN],
                redirectUris: ["https://unit.example.com/callback"],
                authAddress: "https://unit.example.com",
                application: this.createApplication(),
                name: "Unit Interface Client",
            }),
            props,
        );
    }

    public createServiceClient(props: Unit.Domain.EntityFactory.CreateServiceClient.Props = {}): Entities.ServiceClient {
        return this.entity(
            new ServiceClient({
                application: this.createApplication(),
                name: "Unit Service Client",
                code: "unit.service",
            }),
            props,
        );
    }

    public createAuditLog(props: Unit.Domain.EntityFactory.CreateAuditLog.Props = {}): SystemEntities.AuditLog {
        return this.entity(
            new AuditLog({
                context: { userAgent: "unit-agent", ip: "127.0.0.1" },
                actionType: "CREATE",
                entityType: "ACCOUNT",
            }),
            props,
        );
    }

    public createChangeLog(props: Unit.Domain.EntityFactory.CreateChangeLog.Props = {}): SystemEntities.ChangeLog {
        return this.entity(
            new ChangeLog({
                auditEntry: "00000000-0000-4000-8000-0000000000fb",
                entity: "00000000-0000-4000-8000-0000000000fa",
                changeType: ChangeSetType.CREATE,
                entityType: "ACCOUNT",
                delta: {},
            }),
            props,
        );
    }

    public collection<T extends object>(
        props: Unit.Domain.EntityFactory.CollectionFactory.Props<T>,
    ): Unit.Domain.EntityFactory.CollectionFactory.Result<T> {
        return new Collection<T>(props.owner, props.items);
    }

    private entity<Entity extends object>(entity: Entity, props: Partial<Entity>): Entity {
        Object.assign(entity, props);
        return entity;
    }
}
