import { Injectable, Scope } from "@nestjs/common";

import { NotificationCategory, NotificationSource, IdentityActionType, IdentityEntityType } from "~context/enums";
import { AuditJournal, MasterCode, Notification, SecondFactor } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class SecondFactorService implements Services.SecondFactor.Contract {
    public confirm({ transaction, context: { userAgent, ip }, input }: Services.SecondFactor.Confirm): void {
        const secondFactor = new SecondFactor({
            account: input.account,
            secret: input.secret,
            type: input.type,
            name: input.name,
        });

        secondFactor.confirm();

        const masterCode = new MasterCode({
            hash: input.masterCodeHash,
            account: input.account,
        });

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.CONFIRM_SECOND_FACTOR,
            entityType: IdentityEntityType.SECOND_FACTOR,
            at: secondFactor.confirmedAt!,
            entity: input.account.id,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Two-factor authentication enabled",
            body: `A ${input.type} authenticator has been added to your account.`,
            account: input.account,
        });

        transaction.persist(secondFactor);
        transaction.persist(masterCode);
        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);
    }

    public remove({ transaction, context: { userAgent, ip }, input }: Services.SecondFactor.Remove): void {
        transaction.remove(input.factor);

        if (input.factor.account.masterCode) {
            transaction.remove(input.factor.account.masterCode);
        }

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.REMOVE_SECOND_FACTOR,
            entityType: IdentityEntityType.SECOND_FACTOR,
            entity: input.factor.account.id,
            reason: input.reason,
            at: new Date(),
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Two-factor authentication removed",
            body: `A ${input.factor.type} authenticator has been removed from your account.`,
            account: input.factor.account,
        });

        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);
    }

    public enableEnforce({ transaction, context: { userAgent, ip }, input }: Services.SecondFactor.EnableEnforce): void {
        input.account.enableEnforce();

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.ENABLE_ENFORCE_2FA,
            entityType: IdentityEntityType.ACCOUNT,
            at: input.account.updatedAt!,
            entity: input.account.id,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Mandatory two-factor authentication enabled",
            body: "Two-factor authentication is now required for every sign-in.",
            account: input.account,
        });

        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);
    }

    public disableEnforce({ transaction, context: { userAgent, ip }, input }: Services.SecondFactor.DisableEnforce): void {
        input.account.disableEnforce();

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.DISABLE_ENFORCE_2FA,
            entityType: IdentityEntityType.ACCOUNT,
            at: input.account.updatedAt!,
            entity: input.account.id,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Mandatory two-factor authentication disabled",
            body: "Two-factor authentication is no longer required for sign-in.",
            account: input.account,
        });

        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);
    }

    public resetByMasterCode({
        transaction,
        context: { userAgent, ip },
        input,
    }: Services.SecondFactor.ResetByMasterCode): void {
        input.account.resetEnforce();

        for (const factor of input.account.secondFactors) {
            transaction.remove(factor);
        }

        if (input.account.masterCode) {
            transaction.remove(input.account.masterCode);
        }

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.RESET_BY_MASTER_CODE,
            entityType: IdentityEntityType.ACCOUNT,
            at: input.account.updatedAt!,
            entity: input.account.id,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Two-factor authentication reset",
            body: "All authenticators have been removed and mandatory 2FA has been disabled via master code.",
            account: input.account,
        });

        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);
    }
}
