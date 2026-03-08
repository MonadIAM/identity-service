import { Injectable, Scope } from "@nestjs/common";

import { Account, AuditJournal, Identifier, Notification, Password, Profile } from "~context/domain/entities";
import {
    NotificationCategory,
    NotificationSource,
    IdentityActionType,
    IdentityEntityType,
    AccountStatus,
} from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class AccountService implements Services.Account.Contract {
    public async create({
        transaction,
        context: { userAgent, ip },
        input: { subject, password, profile, identifier },
    }: Services.Account.Create): Promise<Account> {
        const account = new Account({
            status: AccountStatus.PENDING,
            subject,
        });

        const profileEntity = new Profile({
            displayName: profile.displayName,
            timeZone: profile.timeZone,
            locale: profile.locale,
            account,
        });

        const identifierEntity = new Identifier({
            value: identifier.value,
            type: identifier.type,
            account,
        });

        const passwordEntity = new Password({
            hash: password,
            account,
        });

        account.assignRelations({
            identifier: identifierEntity,
            password: passwordEntity,
            profile: profileEntity,
        });

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.CREATE_ACCOUNT,
            entityType: IdentityEntityType.ACCOUNT,
            at: account.createdAt,
            entity: account.id,
            userAgent,
            ip,
        });

        transaction.persist(identifierEntity);
        transaction.persist(passwordEntity);
        transaction.persist(profileEntity);
        transaction.persist(auditEntity);
        transaction.persist(account);

        await transaction.flush();

        return account;
    }

    public async createByOAuth({
        transaction,
        context: { userAgent, ip },
        input: { subject, profile, identifier },
    }: Services.Account.CreateByOAuth): Promise<Account> {
        const account = new Account({
            status: AccountStatus.ACTIVE,
            subject,
        });

        const profileEntity = new Profile({
            displayName: profile.displayName,
            timeZone: profile.timeZone,
            locale: profile.locale,
            account,
        });

        const identifierEntity = new Identifier({
            providerUserId: identifier.providerUserId,
            provider: identifier.provider,
            value: identifier.value,
            type: identifier.type,
            isVerified: true,
            account,
        });

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.CREATE_ACCOUNT,
            entityType: IdentityEntityType.ACCOUNT,
            at: account.createdAt,
            entity: account.id,
            userAgent,
            ip,
        });

        transaction.persist(identifierEntity);
        transaction.persist(profileEntity);
        transaction.persist(auditEntity);
        transaction.persist(account);

        await transaction.flush();

        return account;
    }

    public async verify({
        transaction,
        context: { userAgent, ip },
        input: { entity },
    }: Services.Account.Verify): Promise<void> {
        entity.activate();

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.VERIFY_ACCOUNT,
            entityType: IdentityEntityType.ACCOUNT,
            at: entity.updatedAt!,
            entity: entity.id,
            userAgent,
            ip,
        });

        transaction.persist(auditEntity);

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Account verified",
            body: "Your account has been successfully verified.",
            account: entity,
        });

        transaction.persist(notificationEntity);

        await transaction.flush();
    }

    public async deactivate({
        transaction,
        context: { userAgent, ip },
        input: { reason, entity },
    }: Services.Account.Deactivate): Promise<void> {
        entity.deactivate();

        const sessions = await entity.sessions.loadItems();

        for (const session of sessions) {
            transaction.remove(session);
        }

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.DEACTIVATE_ACCOUNT,
            entityType: IdentityEntityType.ACCOUNT,
            at: entity.updatedAt!,
            entity: entity.id,
            userAgent,
            reason,
            ip,
        });

        transaction.persist(auditEntity);

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Account deactivated",
            body: "Your account has been deactivated.",
            account: entity,
        });

        transaction.persist(notificationEntity);

        await transaction.flush();
    }

    public async restore({
        transaction,
        context: { userAgent, ip },
        input: { entity },
    }: Services.Account.Restore): Promise<void> {
        entity.restore();

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.RESTORE_ACCOUNT,
            entityType: IdentityEntityType.ACCOUNT,
            at: entity.updatedAt!,
            entity: entity.id,
            userAgent,
            ip,
        });

        transaction.persist(auditEntity);

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Account restored",
            body: "Your account has been reactivated.",
            account: entity,
        });

        transaction.persist(notificationEntity);

        await transaction.flush();
    }

    public async suspend({
        transaction,
        context: { userAgent, ip },
        input: { reason, entity },
        actor,
    }: Services.Account.Suspend): Promise<void> {
        entity.suspend();

        const sessions = await entity.sessions.loadItems();

        for (const session of sessions) {
            transaction.remove(session);
        }

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.SUSPEND_ACCOUNT,
            entityType: IdentityEntityType.ACCOUNT,
            at: entity.updatedAt!,
            entity: entity.id,
            userAgent,
            by: actor,
            reason,
            ip,
        });

        transaction.persist(auditEntity);

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Account suspended",
            body: "Your account has been suspended.",
            account: entity,
            /* TODO: implement metadata with reason */
        });

        transaction.persist(notificationEntity);

        await transaction.flush();
    }

    public async unsuspend({
        transaction,
        context: { userAgent, ip },
        input: { reason, entity },
        actor,
    }: Services.Account.Unsuspend): Promise<void> {
        entity.unsuspend();

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.UNSUSPEND_ACCOUNT,
            entityType: IdentityEntityType.ACCOUNT,
            at: entity.updatedAt!,
            entity: entity.id,
            userAgent,
            by: actor,
            reason,
            ip,
        });

        transaction.persist(auditEntity);

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Account restored",
            body: "Your account has been restored.",
            account: entity,
        });

        transaction.persist(notificationEntity);

        await transaction.flush();
    }
}
