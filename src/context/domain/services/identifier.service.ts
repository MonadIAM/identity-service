import { Injectable, Scope } from "@nestjs/common";

import { NotificationCategory, NotificationSource, IdentityActionType, IdentityEntityType } from "~context/enums";
import { AuditJournal, Identifier, Notification } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class IdentifierService implements Services.Identifier.Contract {
    public async create({
        transaction,
        context: { userAgent, ip },
        input: { identifier, account },
    }: Services.Identifier.Create): Promise<Identifier> {
        const identifierEntity = new Identifier({
            providerUserId: identifier.providerUserId,
            provider: identifier.provider,
            value: identifier.value,
            type: identifier.type,
            account,
        });

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.ADD_IDENTIFIER,
            entityType: IdentityEntityType.IDENTIFIER,
            at: identifierEntity.createdAt,
            entity: account.id,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "",
            body: "",
            account,
        });

        transaction.persist(notificationEntity);
        transaction.persist(identifierEntity);
        transaction.persist(auditEntity);

        await transaction.flush();

        return identifierEntity;
    }

    public async purge({
        transaction,
        context: { userAgent, ip },
        input: { reason, identifier },
    }: Services.Identifier.Purge): Promise<void> {
        const { account } = identifier;

        identifier.canRemove();

        transaction.remove(identifier);

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.REMOVE_IDENTIFIER,
            entityType: IdentityEntityType.IDENTIFIER,
            at: new Date(),
            entity: account.id,
            userAgent,
            reason,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Identifier removed",
            body: `Your ${identifier.type} identifier has been removed.`,
            account,
        });

        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);

        await transaction.flush();
    }

    public async verify({
        transaction,
        context: { userAgent, ip },
        input: { identifier },
    }: Services.Identifier.Verify): Promise<void> {
        identifier.verify();

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.VERIFY_IDENTIFIER,
            entityType: IdentityEntityType.IDENTIFIER,
            at: identifier.verifiedAt!,
            entity: identifier.account.id,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.ACCOUNT,
            source: NotificationSource.IDENTITY,
            title: "Identifier verified",
            body: `Your ${identifier.type} has been verified.`,
            account: identifier.account,
        });

        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);

        await transaction.flush();
    }

    public async setPrimary({
        transaction,
        context: { userAgent, ip },
        input: { identifier },
    }: Services.Identifier.SetPrimary): Promise<void> {
        const { account } = identifier;

        identifier.canSetAsPrimary();
        account.setPrimaryIdentifier(identifier);

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.SET_PRIMARY_IDENTIFIER,
            entityType: IdentityEntityType.IDENTIFIER,
            at: account.updatedAt!,
            entity: account.id,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Primary identifier changed",
            body: `Your primary identifier has been changed to ${identifier.type}.`,
            account,
        });

        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);

        await transaction.flush();
    }

    public async toggleNotifications({
        transaction,
        context: { userAgent, ip },
        input: { identifier },
    }: Services.Identifier.ToggleNotifications): Promise<void> {
        identifier.toggleNotifications();

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.UPDATE_IDENTIFIER,
            entityType: IdentityEntityType.IDENTIFIER,
            entity: identifier.account.id,
            at: new Date(),
            userAgent,
            ip,
        });

        transaction.persist(auditEntity);

        await transaction.flush();
    }

    public async togglePasswordlessLogin({
        transaction,
        context: { userAgent, ip },
        input: { identifier },
    }: Services.Identifier.TogglePasswordlessLogin): Promise<void> {
        identifier.togglePasswordlessLogin();

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.UPDATE_IDENTIFIER,
            entityType: IdentityEntityType.IDENTIFIER,
            entity: identifier.account.id,
            at: new Date(),
            userAgent,
            ip,
        });

        transaction.persist(auditEntity);

        await transaction.flush();
    }
}
