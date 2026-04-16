import { Injectable, Scope } from "@nestjs/common";

import { Account, Identifier, Password, Profile } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class AccountService implements Services.Account.Contract {
    public create({ transaction, input }: Services.Account.Create.Props): Services.Account.Create.Result {
        const account = new Account({
            status: input.status,
            subject: input.subject,
        });

        const profile = new Profile({
            displayName: input.profile.displayName,
            timeZone: input.profile.timeZone,
            locale: input.profile.locale,
            account,
        });

        const primaryIdentifier = new Identifier({
            providerUserId: input.primaryIdentifier.providerUserId,
            isVerified: input.primaryIdentifier.isVerified,
            provider: input.primaryIdentifier.provider,
            value: input.primaryIdentifier.value,
            type: input.primaryIdentifier.type,
            account,
        });

        const password = input.password ? new Password({ hash: input.password, account }) : undefined;

        account.assignRelations({
            identifier: primaryIdentifier,
            password,
            profile,
        });

        transaction.persist(account);
        transaction.persist(profile);
        transaction.persist(primaryIdentifier);

        if (password) {
            transaction.persist(password);
        }

        if (input.additionalIdentifier) {
            const additional = new Identifier({
                providerUserId: input.additionalIdentifier.providerUserId,
                provider: input.additionalIdentifier.provider,
                value: input.additionalIdentifier.value,
                type: input.additionalIdentifier.type,
                isVerified: input.additionalIdentifier.isVerified,
                account,
            });
            transaction.persist(additional);
        }

        return account;
    }

    public deactivate({ transaction, input }: Services.Account.Deactivate): void {
        for (const session of input.sessions) {
            transaction.remove(session);
        }

        input.account.deactivate();
    }

    public suspend({ transaction, input }: Services.Account.Suspend): void {
        for (const session of input.sessions) {
            transaction.remove(session);
        }

        input.account.suspend();
    }

    public purge({ transaction, input }: Services.Account.Purge): void {
        input.account.canPurge();
        transaction.remove(input.account);
    }

    public verify({ input }: Services.Account.Verify): void {
        input.account.activate();
    }

    public unsuspend({ input }: Services.Account.Unsuspend): void {
        input.account.unsuspend();
    }

    public restore({ input }: Services.Account.Restore): void {
        input.account.restore();
    }
}
