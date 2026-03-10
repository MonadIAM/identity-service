import { Injectable, Scope } from "@nestjs/common";

import { NotificationCategory, NotificationSource, IdentityActionType, IdentityEntityType } from "~context/enums";
import { AuditJournal, MasterCode, Notification, SecondFactor } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class SecondFactorService implements Services.SecondFactor.Contract {
    public async setup({ transaction, input: { factor, account } }: Services.SecondFactor.Setup): Promise<SecondFactor> {
        const secondFactor = new SecondFactor({
            secret: factor.secret,
            type: factor.type,
            name: factor.name,
            account,
        });

        transaction.persist(secondFactor);

        await transaction.flush();

        return secondFactor;
    }

    public async confirm({
        transaction,
        context: { userAgent, ip },
        input: { factor },
    }: Services.SecondFactor.Confirm): Promise<void> {
        factor.confirm();

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.CONFIRM_SECOND_FACTOR,
            entityType: IdentityEntityType.SECOND_FACTOR,
            at: factor.confirmedAt!,
            entity: factor.account.id,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Two-factor authentication enabled",
            body: `A ${factor.type} authenticator has been added to your account.`,
            account: factor.account,
        });

        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);

        await transaction.flush();
    }

    public async remove({
        transaction,
        context: { userAgent, ip },
        input: { reason, factor, confirmedCount },
    }: Services.SecondFactor.Remove): Promise<void> {
        factor.canRemove(factor.account.is2FAEnforced, confirmedCount);

        transaction.remove(factor);

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.REMOVE_SECOND_FACTOR,
            entityType: IdentityEntityType.SECOND_FACTOR,
            entity: factor.account.id,
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
            account: factor.account,
        });

        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);

        await transaction.flush();
    }

    public async enableEnforce({
        transaction,
        context: { userAgent, ip },
        input: { account, masterCodeHash },
    }: Services.SecondFactor.EnableEnforce): Promise<void> {
        account.enableEnforce();

        const masterCode = new MasterCode({
            hash: masterCodeHash,
            account,
        });

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

        transaction.persist(masterCode);
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

        if (account.masterCode) {
            transaction.remove(account.masterCode);
        }

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
        account.disableEnforce();

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
