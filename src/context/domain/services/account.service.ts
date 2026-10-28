import { Inject, Injectable, Scope } from "@nestjs/common";
import { LockMode } from "@mikro-orm/core";

import { ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { IdentifierType } from "~context/enums";

import { Account, Identifier, Password, Profile } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class AccountService implements Services.Account.Contract {
    public constructor(
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.PublicContract,
    ) {}

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

    public async verify(props: Services.Account.Verify.Props): Services.Account.Verify.Result {
        const { transaction, input } = props;
        const account = await this.accountRepository.findUniqueOrThrow({
            transaction,
            options: {
                populate: ["identifiers", "profile"],
                lockMode: LockMode.PESSIMISTIC_WRITE,
                refresh: true,
            },
            where: {
                id: input.account,
            },
        });

        account.activate();

        const identifier = account.identifiers
            .getItems()
            .find((item) => item.type === IdentifierType.EMAIL || item.type === IdentifierType.PHONE);
        if (identifier && !identifier.isVerified) {
            identifier.verify();
        }

        return account;
    }

    public async deactivate(props: Services.Account.Deactivate.Props): Services.Account.Deactivate.Result {
        const { transaction, input } = props;
        const account = await this.accountRepository.findUniqueOrThrow({
            options: { populate: ["sessions"] },
            where: { id: input.account },
            transaction,
        });

        for (const session of account.sessions.getItems()) {
            transaction.remove(session);
        }

        account.deactivate();
    }

    public async suspend(props: Services.Account.Suspend.Props): Services.Account.Suspend.Result {
        const { transaction, input } = props;
        const account = await this.accountRepository.findUniqueOrThrow({
            options: { populate: ["sessions"] },
            where: { id: input.account },
            transaction,
        });

        for (const session of account.sessions.getItems()) {
            transaction.remove(session);
        }

        account.suspend();

        return account;
    }

    public async unsuspend(props: Services.Account.Unsuspend.Props): Services.Account.Unsuspend.Result {
        const { transaction, input } = props;
        const account = await this.accountRepository.findUniqueOrThrow({
            where: { id: input.account },
            transaction,
        });

        account.unsuspend();

        return account;
    }
}
