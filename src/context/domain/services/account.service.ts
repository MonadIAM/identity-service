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
    public create({ transaction, context: { userAgent, ip }, input }: Services.Account.Create): Account {
        const account = new Account({
            status: AccountStatus.PENDING,
            subject: input.subject,
        });

        const profileEntity = new Profile({
            displayName: input.displayName,
            account,
        });

        const identifierEntity = new Identifier({
            value: input.identifier.value,
            type: input.identifier.type,
            account,
        });

        const passwordEntity = new Password({
            hash: input.password,
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

        account.assignRelations({
            identifier: identifierEntity,
            password: passwordEntity,
            profile: profileEntity,
        });

        transaction.persist(account);
        transaction.persist(profileEntity);
        transaction.persist(identifierEntity);
        transaction.persist(passwordEntity);
        transaction.persist(auditEntity);

        return account;
    }

    public createByOAuth({ transaction, context: { userAgent, ip }, input }: Services.Account.CreateByOAuth): Account {
        const account = new Account({
            status: AccountStatus.ACTIVE,
            subject: input.subject,
        });

        const profileEntity = new Profile({
            displayName: input.profile.displayName,
            timeZone: input.profile.timeZone,
            locale: input.profile.locale,
            account,
        });

        const oauthIdentifierEntity = new Identifier({
            providerUserId: input.oauth.providerUserId,
            provider: input.oauth.provider,
            value: input.oauth.value,
            type: input.oauth.type,
            isVerified: true,
            account,
        });

        account.assignRelations({
            identifier: oauthIdentifierEntity,
            profile: profileEntity,
        });

        if (input.email) {
            const emailIdentifierEntity = new Identifier({
                providerUserId: input.email.providerUserId,
                provider: input.email.provider,
                value: input.email.value,
                type: input.email.type,
                isVerified: true,
                account,
            });
            account.setPrimaryIdentifier(emailIdentifierEntity);
            transaction.persist(emailIdentifierEntity);
        }

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.CREATE_ACCOUNT,
            entityType: IdentityEntityType.ACCOUNT,
            at: account.createdAt,
            entity: account.id,
            userAgent,
            ip,
        });

        transaction.persist(oauthIdentifierEntity);
        transaction.persist(profileEntity);
        transaction.persist(auditEntity);
        transaction.persist(account);

        return account;
    }

    public verify({ transaction, context: { userAgent, ip }, input }: Services.Account.Verify): void {
        input.account.activate();

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.VERIFY_ACCOUNT,
            entityType: IdentityEntityType.ACCOUNT,
            at: input.account.updatedAt!,
            entity: input.account.id,
            userAgent,
            ip,
        });

        transaction.persist(auditEntity);

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Account verified",
            body: "Your account has been successfully verified.",
            account: input.account,
        });

        transaction.persist(notificationEntity);
    }

    public deactivate({ transaction, context: { userAgent, ip }, input }: Services.Account.Deactivate): void {
        input.account.deactivate();

        for (const session of input.account.sessions) {
            transaction.remove(session);
        }

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.DEACTIVATE_ACCOUNT,
            entityType: IdentityEntityType.ACCOUNT,
            at: input.account.updatedAt!,
            entity: input.account.id,
            reason: input.reason,
            userAgent,
            ip,
        });

        transaction.persist(auditEntity);

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Account deactivated",
            body: "Your account has been deactivated.",
            account: input.account,
        });

        transaction.persist(notificationEntity);
    }

    public restore({ transaction, context: { userAgent, ip }, input }: Services.Account.Restore): void {
        input.account.restore();

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.RESTORE_ACCOUNT,
            entityType: IdentityEntityType.ACCOUNT,
            at: input.account.updatedAt!,
            entity: input.account.id,
            userAgent,
            ip,
        });

        transaction.persist(auditEntity);

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Account restored",
            body: "Your account has been reactivated.",
            account: input.account,
        });

        transaction.persist(notificationEntity);
    }

    public suspend({ transaction, context: { userAgent, ip }, input, actor }: Services.Account.Suspend): void {
        input.account.suspend();

        for (const session of input.account.sessions) {
            transaction.remove(session);
        }

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.SUSPEND_ACCOUNT,
            entityType: IdentityEntityType.ACCOUNT,
            at: input.account.updatedAt!,
            entity: input.account.id,
            reason: input.reason,
            userAgent,
            by: actor,
            ip,
        });

        transaction.persist(auditEntity);

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Account suspended",
            body: "Your account has been suspended.",
            account: input.account,
            /* TODO: implement metadata with reason */
        });

        transaction.persist(notificationEntity);
    }

    public unsuspend({ transaction, context: { userAgent, ip }, input, actor }: Services.Account.Unsuspend): void {
        input.account.unsuspend();

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.UNSUSPEND_ACCOUNT,
            entityType: IdentityEntityType.ACCOUNT,
            at: input.account.updatedAt!,
            entity: input.account.id,
            reason: input.reason,
            userAgent,
            by: actor,
            ip,
        });

        transaction.persist(auditEntity);

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Account restored",
            body: "Your account has been restored.",
            account: input.account,
        });

        transaction.persist(notificationEntity);
    }
}
