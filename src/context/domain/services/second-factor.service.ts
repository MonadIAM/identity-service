import { Injectable, Scope } from "@nestjs/common";

import { MasterCode, Notification, SecondFactor } from "~context/domain/entities";
import { NotificationCategory, NotificationSource } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class SecondFactorService implements Services.SecondFactor.Contract {
    public confirm({ transaction, input }: Services.SecondFactor.Confirm): void {
        const secondFactor = new SecondFactor({
            account: input.account,
            secret: input.secret,
            type: input.type,
            name: input.name,
        });

        secondFactor.confirm();

        transaction.persist(secondFactor);

        transaction.persist(
            new MasterCode({
                hash: input.masterCodeHash,
                account: input.account,
            }),
        );

        transaction.persist(
            new Notification({
                category: NotificationCategory.SECURITY,
                source: NotificationSource.IDENTITY,
                title: "Two-factor authentication enabled",
                body: `A ${input.type} authenticator has been added to your account.`,
                account: input.account,
            }),
        );
    }

    public remove({ transaction, input }: Services.SecondFactor.Remove): void {
        transaction.remove(input.factor);

        if (input.factor.account.masterCode) {
            transaction.remove(input.factor.account.masterCode);
        }

        transaction.persist(
            new Notification({
                category: NotificationCategory.SECURITY,
                source: NotificationSource.IDENTITY,
                title: "Two-factor authentication removed",
                body: `A ${input.factor.type} authenticator has been removed from your account.`,
                account: input.factor.account,
            }),
        );
    }

    public enableEnforce({ transaction, input }: Services.SecondFactor.EnableEnforce): void {
        input.account.enableEnforce();

        transaction.persist(
            new Notification({
                category: NotificationCategory.SECURITY,
                source: NotificationSource.IDENTITY,
                title: "Mandatory two-factor authentication enabled",
                body: "Two-factor authentication is now required for every sign-in.",
                account: input.account,
            }),
        );
    }

    public disableEnforce({ transaction, input }: Services.SecondFactor.DisableEnforce): void {
        input.account.disableEnforce();

        transaction.persist(
            new Notification({
                category: NotificationCategory.SECURITY,
                source: NotificationSource.IDENTITY,
                title: "Mandatory two-factor authentication disabled",
                body: "Two-factor authentication is no longer required for sign-in.",
                account: input.account,
            }),
        );
    }

    public resetByMasterCode({ transaction, input }: Services.SecondFactor.ResetByMasterCode): void {
        input.account.resetEnforce();

        for (const factor of input.account.secondFactors) {
            transaction.remove(factor);
        }

        if (input.account.masterCode) {
            transaction.remove(input.account.masterCode);
        }

        transaction.persist(
            new Notification({
                category: NotificationCategory.SECURITY,
                source: NotificationSource.IDENTITY,
                title: "Two-factor authentication reset",
                body: "All authenticators have been removed and mandatory 2FA has been disabled via master code.",
                account: input.account,
            }),
        );
    }
}
