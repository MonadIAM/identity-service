import { Injectable, Scope } from "@nestjs/common";

import { NotificationCategory, NotificationSource, IdentityActionType, IdentityEntityType } from "~context/enums";
import { AuditJournal, MasterCode, Notification, SecondFactor } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class SecondFactorService implements Services.SecondFactor.Contract {
    public async confirm({
        transaction,
        context: { userAgent, ip },
        input: { masterCodeHash, account, secret, type, name },
    }: Services.SecondFactor.Confirm): Promise<void> {
        const secondFactor = new SecondFactor({
            account,
            secret,
            type,
            name,
        });

        secondFactor.confirm();

        const masterCode = new MasterCode({
            hash: masterCodeHash,
            account,
        });

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.CONFIRM_SECOND_FACTOR,
            entityType: IdentityEntityType.SECOND_FACTOR,
            at: secondFactor.confirmedAt!,
            entity: account.id,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Two-factor authentication enabled",
            body: `A ${type} authenticator has been added to your account.`,
            account,
        });

        transaction.persist(secondFactor);
        transaction.persist(masterCode);
        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);

        await transaction.flush();
    }

    public async remove({
        transaction,
        context: { userAgent, ip },
        input: { reason, factor },
    }: Services.SecondFactor.Remove): Promise<void> {
        const { account } = factor;

        transaction.remove(factor);

        if (account.masterCode) {
            transaction.remove(account.masterCode);
        }

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.REMOVE_SECOND_FACTOR,
            entityType: IdentityEntityType.SECOND_FACTOR,
            entity: account.id,
            at: new Date(),
            userAgent,
            reason,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Two-factor authentication removed",
            body: `A ${factor.type} authenticator has been removed from your account.`,
            account,
        });

        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);

        await transaction.flush();
    }

    public async enableEnforce({
        transaction,
        context: { userAgent, ip },
        input: { account },
    }: Services.SecondFactor.EnableEnforce): Promise<void> {
        account.enableEnforce();

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.ENABLE_ENFORCE_2FA,
            entityType: IdentityEntityType.ACCOUNT,
            at: account.updatedAt!,
            entity: account.id,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Mandatory two-factor authentication enabled",
            body: "Two-factor authentication is now required for every sign-in.",
            account,
        });

        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);

        await transaction.flush();
    }

    public async disableEnforce({
        transaction,
        context: { userAgent, ip },
        input: { account },
    }: Services.SecondFactor.DisableEnforce): Promise<void> {
        account.disableEnforce();

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.DISABLE_ENFORCE_2FA,
            entityType: IdentityEntityType.ACCOUNT,
            at: account.updatedAt!,
            entity: account.id,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Mandatory two-factor authentication disabled",
            body: "Two-factor authentication is no longer required for sign-in.",
            account,
        });

        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);

        await transaction.flush();
    }

    public async resetByMasterCode({
        transaction,
        context: { userAgent, ip },
        input: { account },
    }: Services.SecondFactor.ResetByMasterCode): Promise<void> {
        account.resetEnforce();

        const secondFactors = await account.secondFactors.loadItems();

        for (const factor of secondFactors) {
            transaction.remove(factor);
        }

        if (account.masterCode) {
            transaction.remove(account.masterCode);
        }

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.RESET_BY_MASTER_CODE,
            entityType: IdentityEntityType.ACCOUNT,
            at: account.updatedAt!,
            entity: account.id,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Two-factor authentication reset",
            body: "All authenticators have been removed and mandatory 2FA has been disabled via master code.",
            account,
        });

        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);

        await transaction.flush();
    }
}
