import { ChangeSetType } from "@mikro-orm/core";
import { randomUUID } from "node:crypto";

import { AuditLog, ChangeLog } from "~common/transaction-manager/entities";
import { DeltaChanges } from "~common/transaction-manager/value-objects";
import {
    MembershipHistory,
    InterfaceClient,
    PasswordHistory,
    RecoveryCode,
    ServiceClient,
    SecondFactor,
    Application,
    Identifier,
    MasterCode,
    Membership,
    Password,
    Profile,
    Session,
    Account,
    Invite,
} from "~context/domain/entities";
import {
    AuthenticationContextClass,
    SecondFactorType,
    AccountSubject,
    TokenGrantType,
    IdentifierType,
    AccountStatus,
    ActionType,
    EntityType,
} from "~context/enums";

export class CoreFixture implements Fixtures.Core.Contract {
    private sequence = 0;

    public constructor(protected readonly entityManager: ORM.EntityManager) {}

    public async createAccount(props: Fixtures.Core.CreateAccount.Props = {}): Fixtures.Core.CreateAccount.Result {
        const account = new Account({
            subject: props.subject ?? AccountSubject.HUMAN,
            status: props.status ?? AccountStatus.ACTIVE,
        });

        account.is2FAEnforced = props.is2FAEnforced ?? account.is2FAEnforced;
        account.createdAt = props.createdAt ?? account.createdAt;
        account.lastActiveAt = props.lastActiveAt;
        account.updatedAt = props.updatedAt;

        return await this.persist(account);
    }

    public async createProfile(props: Fixtures.Core.CreateProfile.Props): Fixtures.Core.CreateProfile.Result {
        const profile = new Profile({
            displayName: props.displayName ?? "Test Account",
            pictureUrl: props.pictureUrl,
            timeZone: props.timeZone,
            account: props.account,
            locale: props.locale,
        });

        return await this.persist(profile);
    }

    public async createIdentifier(props: Fixtures.Core.CreateIdentifier.Props): Fixtures.Core.CreateIdentifier.Result {
        const type = props.type ?? IdentifierType.EMAIL;
        const identifier = new Identifier({
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

    public async createApplication(
        props: Fixtures.Core.CreateApplication.Props = {},
    ): Fixtures.Core.CreateApplication.Result {
        const application = new Application({
            name: props.name ?? this.nextName("Application"),
            isSystemManaged: props.isSystemManaged,
            isRealmRevoked: props.isRealmRevoked,
            realm: props.realm ?? randomUUID(),
            realmVersion: props.realmVersion,
            description: props.description,
            isRevoked: props.isRevoked,
        });

        return await this.persist(application);
    }

    public async createInterfaceClient(
        props: Fixtures.Core.CreateInterfaceClient.Props,
    ): Fixtures.Core.CreateInterfaceClient.Result {
        const client = new InterfaceClient({
            redirectUris: props.redirectUris ?? ["https://client.test/callback"],
            grantTypes: props.grantTypes ?? [TokenGrantType.AUTHORIZATION_CODE],
            authAddress: props.authAddress ?? "https://client.test/auth",
            name: props.name ?? this.nextName("Interface Client"),
            isApplicationRevoked: props.isApplicationRevoked,
            applicationVersion: props.applicationVersion,
            isSystemManaged: props.isSystemManaged,
            application: props.application,
            description: props.description,
            isRevoked: props.isRevoked,
        });

        return await this.persist(client);
    }

    public async createServiceClient(
        props: Fixtures.Core.CreateServiceClient.Props,
    ): Fixtures.Core.CreateServiceClient.Result {
        const client = new ServiceClient({
            name: props.name ?? this.nextName("Service Client"),
            isApplicationRevoked: props.isApplicationRevoked,
            applicationVersion: props.applicationVersion,
            code: props.code ?? this.nextCode("service"),
            allowedAddresses: props.allowedAddresses,
            isSystemManaged: props.isSystemManaged,
            application: props.application,
            description: props.description,
            isRevoked: props.isRevoked,
        });

        return await this.persist(client);
    }

    public async createSession(props: Fixtures.Core.CreateSession.Props): Fixtures.Core.CreateSession.Result {
        const session = new Session({
            expiresAt: props.expiresAt ?? new Date("2099-01-01T00:00:00.000Z"),
            acr: props.acr ?? AuthenticationContextClass.PASSWORD,
            client: props.client ?? "identity-test-client",
            userAgent: props.userAgent ?? "identity-test",
            realms: props.realms ?? [randomUUID()],
            scope: props.scope ?? "openid profile",
            ip: props.ip ?? "127.0.0.1",
            account: props.account,
        });

        session.createdAt = props.createdAt ?? session.createdAt;
        session.lastRefreshedAt = props.lastRefreshedAt ?? session.lastRefreshedAt;
        session.refreshTokenHash = props.refreshTokenHash ?? this.nextCode("refresh-token-hash");

        return await this.persist(session);
    }

    public async createRecoveryCode(
        props: Fixtures.Core.CreateRecoveryCode.Props,
    ): Fixtures.Core.CreateRecoveryCode.Result {
        const code = new RecoveryCode({
            hash: props.hash ?? this.nextCode("recovery"),
            account: props.account,
        });

        if (props.used) {
            code.use();
        }

        return await this.persist(code);
    }

    public async createMembership(props: Fixtures.Core.CreateMembership.Props): Fixtures.Core.CreateMembership.Result {
        const membership = new Membership({
            joinedAt: props.joinedAt ?? new Date("2026-01-01T00:00:00.000Z"),
            invitedBy: props.invitedBy ?? randomUUID(),
            realm: props.realm ?? randomUUID(),
            account: props.account,
        });

        return await this.persist(membership);
    }

    public async createMembershipHistory(
        props: Fixtures.Core.CreateMembershipHistory.Props = {},
    ): Fixtures.Core.CreateMembershipHistory.Result {
        const history = new MembershipHistory({
            joinedAt: props.joinedAt ?? new Date("2026-01-01T00:00:00.000Z"),
            invitedBy: props.invitedBy ?? randomUUID(),
            account: props.account ?? randomUUID(),
            realm: props.realm ?? randomUUID(),
        });

        history.excludedBy = props.excludedBy;
        history.leaveAt = props.leaveAt;

        return await this.persist(history);
    }

    public async createPassword(props: Fixtures.Core.CreatePassword.Props): Fixtures.Core.CreatePassword.Result {
        const password = new Password({
            hash: props.hash ?? this.nextCode("password-hash"),
            account: props.account,
        });

        return await this.persist(password);
    }

    public async createPasswordHistory(
        props: Fixtures.Core.CreatePasswordHistory.Props,
    ): Fixtures.Core.CreatePasswordHistory.Result {
        const history = new PasswordHistory({
            hash: props.hash ?? this.nextCode("previous-password-hash"),
            version: props.version ?? 1,
            account: props.account,
        });

        return await this.persist(history);
    }

    public async createMasterCode(props: Fixtures.Core.CreateMasterCode.Props): Fixtures.Core.CreateMasterCode.Result {
        const masterCode = new MasterCode({
            hash: props.hash ?? this.nextCode("master-code-hash"),
            account: props.account,
        });

        return await this.persist(masterCode);
    }

    public async createSecondFactor(
        props: Fixtures.Core.CreateSecondFactor.Props,
    ): Fixtures.Core.CreateSecondFactor.Result {
        const secondFactor = new SecondFactor({
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

    public async createInvite(props: Fixtures.Core.CreateInvite.Props): Fixtures.Core.CreateInvite.Result {
        const invite = new Invite({
            realm: props.realm ?? randomUUID(),
            role: props.role ?? randomUUID(),
            invitee: props.invitee,
            inviter: props.inviter,
        });

        return await this.persist(invite);
    }

    public async createAuditLog(props: Fixtures.Core.CreateAuditLog.Props = {}): Fixtures.Core.CreateAuditLog.Result {
        const auditLog = new AuditLog({
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
        const changeLog = new ChangeLog({
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
