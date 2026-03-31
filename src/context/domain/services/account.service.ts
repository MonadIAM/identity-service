import { Injectable, Scope } from "@nestjs/common";

import { Account, Identifier, Notification, Password, Profile } from "~context/domain/entities";
import { NotificationCategory, NotificationSource, AccountStatus } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class AccountService implements Services.Account.Contract {
    public create({ transaction, input }: Services.Account.Create): Account {
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

        account.assignRelations({
            identifier: identifierEntity,
            password: passwordEntity,
            profile: profileEntity,
        });

        transaction.persist(account);
        transaction.persist(profileEntity);
        transaction.persist(identifierEntity);
        transaction.persist(passwordEntity);

        return account;
    }

    public createByOAuth({ transaction, input }: Services.Account.CreateByOAuth): Account {
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

        transaction.persist(oauthIdentifierEntity);
        transaction.persist(profileEntity);
        transaction.persist(account);

        return account;
    }

    public verify({ transaction, input }: Services.Account.Verify): void {
        input.account.activate();

        transaction.persist(
            new Notification({
                category: NotificationCategory.SECURITY,
                source: NotificationSource.IDENTITY,
                title: "Account verified",
                body: "Your account has been successfully verified.",
                account: input.account,
            }),
        );
    }

    public deactivate({ transaction, input }: Services.Account.Deactivate): void {
        input.account.deactivate();

        for (const session of input.account.sessions) {
            transaction.remove(session);
        }

        transaction.persist(
            new Notification({
                category: NotificationCategory.SECURITY,
                source: NotificationSource.IDENTITY,
                title: "Account deactivated",
                body: "Your account has been deactivated.",
                account: input.account,
            }),
        );
    }

    public restore({ transaction, input }: Services.Account.Restore): void {
        input.account.restore();

        transaction.persist(
            new Notification({
                category: NotificationCategory.SECURITY,
                source: NotificationSource.IDENTITY,
                title: "Account restored",
                body: "Your account has been reactivated.",
                account: input.account,
            }),
        );
    }

    public suspend({ transaction, input }: Services.Account.Suspend): void {
        input.account.suspend();

        for (const session of input.account.sessions) {
            transaction.remove(session);
        }

        transaction.persist(
            new Notification({
                category: NotificationCategory.SECURITY,
                source: NotificationSource.IDENTITY,
                title: "Account suspended",
                body: "Your account has been suspended.",
                account: input.account,
                /* TODO: implement metadata with reason */
            }),
        );
    }

    public unsuspend({ transaction, input }: Services.Account.Unsuspend): void {
        input.account.unsuspend();

        transaction.persist(
            new Notification({
                category: NotificationCategory.SECURITY,
                source: NotificationSource.IDENTITY,
                title: "Account restored",
                body: "Your account has been restored.",
                account: input.account,
            }),
        );
    }
}
