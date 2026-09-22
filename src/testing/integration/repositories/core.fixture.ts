import { ChangeSetType } from "@mikro-orm/core";
import { randomUUID } from "node:crypto";

import { EntityFactoryRegistry } from "~testing/entity-factory.registry";
import { DeltaChanges } from "~common/transaction-manager/value-objects";
import {
    AuthenticationContextClass,
    SecondFactorType,
    TokenGrantType,
    IdentifierType,
    ActionType,
    EntityType,
} from "~context/enums";

export class CoreFixture implements Fixtures.Core.Contract {
    private readonly entities = new EntityFactoryRegistry();
    private sequence = 0;

    public constructor(protected readonly entityManager: ORM.EntityManager) {}

    public async createAccount(props: Fixtures.Core.CreateAccount.Props = {}): Fixtures.Core.CreateAccount.Result {
        return await this.persist(this.entities.createAccount(props));
    }

    public async createProfile(props: Fixtures.Core.CreateProfile.Props): Fixtures.Core.CreateProfile.Result {
        return await this.persist(
            this.entities.createProfile({
                ...props,
                displayName: props.displayName ?? "Test Account",
            }),
        );
    }

    public async createIdentifier(props: Fixtures.Core.CreateIdentifier.Props): Fixtures.Core.CreateIdentifier.Result {
        const type = props.type ?? IdentifierType.EMAIL;
        const identifier = this.entities.createIdentifier({
            identity: props.identity ?? this.nextIdentity(type),
            providerUserId: props.providerUserId,
            provider: props.provider,
            account: props.account,
            type,
        });

        if (props.isVerified) {
            identifier.verify();
        }
        if (props.isPublicContact) {
            if (!identifier.isVerified) {
                identifier.verify();
            }
            identifier.togglePublicContact();
        }

        identifier.createdAt = props.createdAt ?? identifier.createdAt;
        identifier.lastUsedAt = props.lastUsedAt;

        return await this.persist(identifier);
    }

    public async createInterfaceClient(
        props: Fixtures.Core.CreateInterfaceClient.Props,
    ): Fixtures.Core.CreateInterfaceClient.Result {
        return await this.persist(
            this.entities.createInterfaceClient({
                ...props,
                redirectUris: props.redirectUris ?? ["https://client.test/callback"],
                grantTypes: props.grantTypes ?? [TokenGrantType.AUTHORIZATION_CODE],
                authAddress: props.authAddress ?? "https://client.test/auth",
                name: props.name ?? this.nextName("Interface Client"),
            }),
        );
    }

    public async createServiceClient(
        props: Fixtures.Core.CreateServiceClient.Props,
    ): Fixtures.Core.CreateServiceClient.Result {
        return await this.persist(
            this.entities.createServiceClient({
                ...props,
                name: props.name ?? this.nextName("Service Client"),
                code: props.code ?? this.nextCode("service"),
            }),
        );
    }

    public async createSession(props: Fixtures.Core.CreateSession.Props): Fixtures.Core.CreateSession.Result {
        const session = this.entities.createSession({
            ...props,
            refreshTokenHash: props.refreshTokenHash ?? this.nextCode("refresh-token-hash"),
            expiresAt: props.expiresAt ?? new Date("2099-01-01T00:00:00.000Z"),
            acr: props.acr ?? AuthenticationContextClass.PASSWORD,
            client: props.client ?? "identity-test-client",
            userAgent: props.userAgent ?? "identity-test",
            realms: props.realms ?? [randomUUID()],
            scope: props.scope ?? "openid profile",
            ip: props.ip ?? "127.0.0.1",
            account: props.account,
        });

        return await this.persist(session);
    }

    public async createRecoveryCode(
        props: Fixtures.Core.CreateRecoveryCode.Props,
    ): Fixtures.Core.CreateRecoveryCode.Result {
        const code = this.entities.createRecoveryCode({
            hash: props.hash ?? this.nextCode("recovery"),
            account: props.account,
        });

        if (props.used) {
            code.use();
        }

        return await this.persist(code);
    }

    public async createPassword(props: Fixtures.Core.CreatePassword.Props): Fixtures.Core.CreatePassword.Result {
        return await this.persist(
            this.entities.createPassword({
                hash: props.hash ?? this.nextCode("password-hash"),
                account: props.account,
            }),
        );
    }

    public async createPasswordHistory(
        props: Fixtures.Core.CreatePasswordHistory.Props,
    ): Fixtures.Core.CreatePasswordHistory.Result {
        return await this.persist(
            this.entities.createPasswordHistory({
                hash: props.hash ?? this.nextCode("previous-password-hash"),
                version: props.version ?? 1,
                account: props.account,
            }),
        );
    }

    public async createMasterCode(props: Fixtures.Core.CreateMasterCode.Props): Fixtures.Core.CreateMasterCode.Result {
        return await this.persist(
            this.entities.createMasterCode({
                hash: props.hash ?? this.nextCode("master-code-hash"),
                account: props.account,
            }),
        );
    }

    public async createSecondFactor(
        props: Fixtures.Core.CreateSecondFactor.Props,
    ): Fixtures.Core.CreateSecondFactor.Result {
        const secondFactor = this.entities.createSecondFactor({
            secret: props.secret ?? this.nextCode("secret"),
            type: props.type ?? SecondFactorType.TOTP,
            name: props.name ?? "Authenticator",
            account: props.account,
        });

        if (props.confirmed) {
            secondFactor.confirm();
        }

        if (props.lastAcceptedTOTPStep !== undefined) {
            secondFactor.acceptTOTP(props.lastAcceptedTOTPStep);
        }

        return await this.persist(secondFactor);
    }

    public async createAuditLog(props: Fixtures.Core.CreateAuditLog.Props = {}): Fixtures.Core.CreateAuditLog.Result {
        const auditLog = this.entities.createAuditLog({
            entityType: props.entityType ?? EntityType.ACCOUNT,
            actionType: props.actionType ?? ActionType.CREATE,
            actor: props.actor ?? randomUUID(),
            realm: props.realm ?? randomUUID(),
            input: props.input,
            context: {
                userAgent: props.context?.userAgent ?? "identity-test",
                ip: props.context?.ip ?? "127.0.0.1",
            },
        });

        auditLog.sign({ keyVersion: 1, signature: "test-signature" });

        return await this.persist(auditLog);
    }

    public async createChangeLog(props: Fixtures.Core.CreateChangeLog.Props = {}): Fixtures.Core.CreateChangeLog.Result {
        const auditEntry = props.auditEntry ?? (await this.createAuditLog());
        const changeLog = this.entities.createChangeLog({
            delta: props.delta ?? new DeltaChanges({ name: { old: null, new: "Updated Name" } }),
            changeType: props.changeType ?? ChangeSetType.CREATE,
            entityType: props.entityType ?? EntityType.ACCOUNT,
            entity: props.entity ?? randomUUID(),
            auditEntry: auditEntry.id,
        });

        changeLog.sign({ keyVersion: 1, signature: "test-signature" });

        return await this.persist(changeLog);
    }

    private async persist<Entity extends ORM.AnyEntity>(entity: Entity): Promise<Entity> {
        this.entityManager.persist(entity);
        await this.entityManager.flush();

        return entity;
    }

    protected async setCreatedAt<Entity extends { createdAt: Date }>(
        entities: readonly Entity[],
        createdAt: Date,
    ): Promise<void> {
        for (const entity of entities) {
            entity.createdAt = new Date(createdAt);
        }

        await this.entityManager.flush();
    }

    private nextIdentity(type: IdentifierType): string {
        if (type === IdentifierType.PHONE) {
            return `+1555000${this.nextSequence()}`;
        } else {
            return `${this.nextCode("account")}@example.test`;
        }
    }

    private nextName(prefix: string): string {
        return `${prefix} ${this.nextSequence()}`;
    }

    private nextCode(prefix: string): string {
        return `${prefix}.${this.nextSequence()}`;
    }

    private nextSequence(): number {
        this.sequence += 1;

        return this.sequence;
    }
}
