import { Injectable, Scope } from "@nestjs/common";

import { Account, Identifier, Password, Profile } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class AccountService implements Services.Account.Contract {
    public create(props: Services.Account.Create.Props): Services.Account.Create.Result {
        const { transaction, input } = props;
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
            identity: input.primaryIdentifier.identity,
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
                identity: input.additionalIdentifier.identity,
                type: input.additionalIdentifier.type,
                isVerified: input.additionalIdentifier.isVerified,
                account,
            });
            transaction.persist(additional);
        }

        return account;
    }

    public deactivate(props: Services.Account.Deactivate.Props): Services.Account.Deactivate.Result {
        const { transaction, input } = props;
        for (const session of input.sessions) {
            transaction.remove(session);
        }

        input.account.deactivate();
    }

    public suspend(props: Services.Account.Suspend.Props): Services.Account.Suspend.Result {
        const { transaction, input } = props;
        for (const session of input.sessions) {
            transaction.remove(session);
        }

        input.account.suspend();
    }

    public purge(props: Services.Account.Purge.Props): Services.Account.Purge.Result {
        const { transaction, input } = props;
        transaction.remove(input.account);
    }

    public verify(props: Services.Account.Verify.Props): Services.Account.Verify.Result {
        const { input } = props;
        input.account.activate();
    }

    public unsuspend(props: Services.Account.Unsuspend.Props): Services.Account.Unsuspend.Result {
        const { input } = props;
        input.account.unsuspend();
    }

    public restore(props: Services.Account.Restore.Props): Services.Account.Restore.Result {
        const { input } = props;
        input.account.restore();
    }
}
