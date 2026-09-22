import { ChangeSetType, Collection } from "@mikro-orm/core";

import { SecondFactorType, IdentifierType, TokenGrantType, AccountSubject, AccountStatus } from "~context/enums";
import { AuditLog, ChangeLog } from "~common/transaction-manager/entities";
import {
    PasswordHistory,
    InterfaceClient,
    ServiceClient,
    RecoveryCode,
    SecondFactor,
    MasterCode,
    Identifier,
    Password,
    Session,
    Profile,
    Account,
} from "~context/domain/entities";

export class EntityFactoryRegistry implements Testing.EntityFactory.Contract {
    public createAccount(props: Testing.EntityFactory.CreateAccount.Props = {}): Entities.Account {
        return this.entity(
            new Account({
                ...props,
                subject: props.subject ?? AccountSubject.HUMAN,
                status: props.status ?? AccountStatus.ACTIVE,
            }),
            props,
        );
    }

    public createProfile(props: Testing.EntityFactory.CreateProfile.Props = {}): Entities.Profile {
        return this.entity(
            new Profile({
                ...props,
                account: props.account ?? this.createAccount(),
                displayName: props.displayName ?? "Unit Account",
            }),
            props,
        );
    }

    public createIdentifier(props: Testing.EntityFactory.CreateIdentifier.Props = {}): Entities.Identifier {
        return this.entity(
            new Identifier({
                ...props,
                account: props.account ?? this.createAccount(),
                identity: props.identity ?? "unit@example.com",
                type: props.type ?? IdentifierType.EMAIL,
            }),
            props,
        );
    }

    public createPassword(props: Testing.EntityFactory.CreatePassword.Props = {}): Entities.Password {
        return this.entity(
            new Password({
                ...props,
                account: props.account ?? this.createAccount(),
                hash: props.hash ?? "unit-password-hash",
            }),
            props,
        );
    }

    public createPasswordHistory(props: Testing.EntityFactory.CreatePasswordHistory.Props = {}): Entities.PasswordHistory {
        return this.entity(
            new PasswordHistory({
                ...props,
                account: props.account ?? this.createAccount(),
                hash: props.hash ?? "unit-previous-hash",
                version: props.version ?? 1,
            }),
            props,
        );
    }

    public createRecoveryCode(props: Testing.EntityFactory.CreateRecoveryCode.Props = {}): Entities.RecoveryCode {
        return this.entity(
            new RecoveryCode({
                ...props,
                account: props.account ?? this.createAccount(),
                hash: props.hash ?? "unit-recovery-hash",
            }),
            props,
        );
    }

    public createMasterCode(props: Testing.EntityFactory.CreateMasterCode.Props = {}): Entities.MasterCode {
        return this.entity(
            new MasterCode({
                ...props,
                account: props.account ?? this.createAccount(),
                hash: props.hash ?? "unit-master-hash",
            }),
            props,
        );
    }

    public createSecondFactor(props: Testing.EntityFactory.CreateSecondFactor.Props = {}): Entities.SecondFactor {
        return this.entity(
            new SecondFactor({
                ...props,
                account: props.account ?? this.createAccount(),
                type: props.type ?? SecondFactorType.TOTP,
                secret: props.secret ?? "unit-secret",
                name: props.name ?? "Unit Factor",
            }),
            props,
        );
    }

    public createSession(props: Testing.EntityFactory.CreateSession.Props = {}): Entities.Session {
        return this.entity(
            new Session({
                ...props,
                expiresAt: props.expiresAt ?? new Date("2999-01-01T00:00:00.000Z"),
                account: props.account ?? this.createAccount(),
                userAgent: props.userAgent ?? "unit-agent",
                client: props.client ?? "unit-client",
                scope: props.scope ?? "openid",
                ip: props.ip ?? "127.0.0.1",
                realms: props.realms ?? [],
                acr: props.acr ?? "1",
            }),
            props,
        );
    }

    public createInterfaceClient(props: Testing.EntityFactory.CreateInterfaceClient.Props = {}): Entities.InterfaceClient {
        return this.entity(
            new InterfaceClient({
                ...props,
                grantTypes: props.grantTypes ?? [TokenGrantType.AUTHORIZATION_CODE, TokenGrantType.REFRESH_TOKEN],
                redirectUris: props.redirectUris ?? ["https://unit.example.com/callback"],
                authAddress: props.authAddress ?? "https://unit.example.com",
                realm: props.realm ?? "00000000-0000-4000-8000-000000000001",
                name: props.name ?? "Unit Interface Client",
            }),
            props,
        );
    }

    public createServiceClient(props: Testing.EntityFactory.CreateServiceClient.Props = {}): Entities.ServiceClient {
        return this.entity(
            new ServiceClient({
                ...props,
                realm: props.realm ?? "00000000-0000-4000-8000-000000000001",
                name: props.name ?? "Unit Service Client",
                code: props.code ?? "unit.service",
            }),
            props,
        );
    }

    public createAuditLog(props: Testing.EntityFactory.CreateAuditLog.Props = {}): SystemEntities.AuditLog {
        const { context, ...state } = props;

        return this.entity(
            new AuditLog({
                ...state,
                context: { userAgent: context?.userAgent ?? "unit-agent", ip: context?.ip ?? "127.0.0.1" },
                actionType: props.actionType ?? "CREATE",
                entityType: props.entityType ?? "ACCOUNT",
            }),
            state,
        );
    }

    public createChangeLog(props: Testing.EntityFactory.CreateChangeLog.Props = {}): SystemEntities.ChangeLog {
        return this.entity(
            new ChangeLog({
                ...props,
                auditEntry: props.auditEntry ?? "00000000-0000-4000-8000-0000000000fb",
                entity: props.entity ?? "00000000-0000-4000-8000-0000000000fa",
                changeType: props.changeType ?? ChangeSetType.CREATE,
                entityType: props.entityType ?? "ACCOUNT",
                delta: props.delta ?? {},
            }),
            props,
        );
    }

    public collection<T extends object>(
        props: Testing.EntityFactory.CollectionFactory.Props<T>,
    ): Testing.EntityFactory.CollectionFactory.Result<T> {
        return new Collection<T>(props.owner, props.items);
    }

    private entity<Entity extends object>(entity: Entity, props: Partial<Entity>): Entity {
        Object.assign(entity, props);
        return entity;
    }
}
