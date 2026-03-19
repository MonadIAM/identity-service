import { Injectable, Scope } from "@nestjs/common";

import { NotificationCategory, NotificationSource, IdentityActionType, IdentityEntityType } from "~context/enums";
import { AuditJournal, Identifier, Notification } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class IdentifierService implements Services.Identifier.Contract {
    public create({ transaction, context: { userAgent, ip }, input }: Services.Identifier.Create): Identifier {
        const identifierEntity = new Identifier({
            providerUserId: input.identifier.providerUserId,
            provider: input.identifier.provider,
            value: input.identifier.value,
            type: input.identifier.type,
            account: input.account,
        });

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.ADD_IDENTIFIER,
            entityType: IdentityEntityType.IDENTIFIER,
            at: identifierEntity.createdAt,
            entity: input.account.id,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "",
            body: "",
            account: input.account,
        });

        transaction.persist(notificationEntity);
        transaction.persist(identifierEntity);
        transaction.persist(auditEntity);

        return identifierEntity;
    }

    public purge({ transaction, context: { userAgent, ip }, input }: Services.Identifier.Purge): void {
        input.identifier.canRemove();

        transaction.remove(input.identifier);

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.REMOVE_IDENTIFIER,
            entityType: IdentityEntityType.IDENTIFIER,
            entity: input.identifier.account.id,
            reason: input.reason,
            at: new Date(),
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Identifier removed",
            body: `Your ${input.identifier.type} identifier has been removed.`,
            account: input.identifier.account,
        });

        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);
    }

    public verify({ transaction, context: { userAgent, ip }, input }: Services.Identifier.Verify): void {
        input.identifier.verify();

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.VERIFY_IDENTIFIER,
            entityType: IdentityEntityType.IDENTIFIER,
            entity: input.identifier.account.id,
            at: input.identifier.verifiedAt!,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.ACCOUNT,
            source: NotificationSource.IDENTITY,
            title: "Identifier verified",
            body: `Your ${input.identifier.type} has been verified.`,
            account: input.identifier.account,
        });

        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);
    }

    public setPrimary({ transaction, context: { userAgent, ip }, input }: Services.Identifier.SetPrimary): void {
        input.identifier.canSetAsPrimary();
        input.identifier.account.setPrimaryIdentifier(input.identifier);

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.SET_PRIMARY_IDENTIFIER,
            entityType: IdentityEntityType.IDENTIFIER,
            at: input.identifier.account.updatedAt!,
            entity: input.identifier.account.id,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Primary identifier changed",
            body: `Your primary identifier has been changed to ${input.identifier.type}.`,
            account: input.identifier.account,
        });

        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);
    }

    public toggleNotifications({
        transaction,
        context: { userAgent, ip },
        input,
    }: Services.Identifier.ToggleNotifications): void {
        input.identifier.toggleNotifications();

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.UPDATE_IDENTIFIER,
            entityType: IdentityEntityType.IDENTIFIER,
            entity: input.identifier.account.id,
            at: new Date(),
            userAgent,
            ip,
        });

        transaction.persist(auditEntity);
    }

    public togglePasswordlessLogin({
        transaction,
        context: { userAgent, ip },
        input,
    }: Services.Identifier.TogglePasswordlessLogin): void {
        input.identifier.togglePasswordlessLogin();

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.UPDATE_IDENTIFIER,
            entityType: IdentityEntityType.IDENTIFIER,
            entity: input.identifier.account.id,
            at: new Date(),
            userAgent,
            ip,
        });

        transaction.persist(auditEntity);
    }
}
