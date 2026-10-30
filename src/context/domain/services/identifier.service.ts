import { LockMode, QueryOrder } from "@mikro-orm/postgresql";
import { Inject, Injectable, Scope } from "@nestjs/common";
import { isString } from "class-validator";

import { IDENTIFIER_REPOSITORY, ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { IdentifierType } from "~context/enums";
import { Exception } from "~common/exceptions";

import { Identifier } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class IdentifierService implements Services.Identifier.Contract {
    private readonly dictionaryPath = "services.identifier";

    public constructor(
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.PublicContract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.PublicContract,
    ) {}

    public async create(props: Services.Identifier.Create.Props): Services.Identifier.Create.Result {
        const { transaction, input } = props;
        const account = isString(input.account)
            ? await this.accountRepository.findUniqueOrThrow({ where: { id: input.account }, transaction })
            : input.account;

        const identifierEntity = new Identifier({
            providerUserId: input.identifier.providerUserId,
            provider: input.identifier.provider,
            identity: input.identifier.identity,
            type: input.identifier.type,
            account,
        });

        transaction.persist(identifierEntity);

        return identifierEntity;
    }

    public async verify(props: Services.Identifier.Verify.Props): Services.Identifier.Verify.Result {
        const { transaction, input } = props;
        await this.accountRepository.findUniqueOrThrow({
            options: { lockMode: LockMode.PESSIMISTIC_WRITE },
            where: { id: input.account },
            transaction,
        });

        const identifier = await this.identifierRepository.findUniqueOrThrow({
            where: { id: input.identifier, account: input.account },
            options: { refresh: true },
            transaction,
        });

        if (identifier.isVerified) {
            throw Exception.conflict({ messageKey: `${this.dictionaryPath}.ALREADY_VERIFIED` });
        } else {
            identifier.verify();
        }

        return identifier;
    }

    public async selectNotificationEmail(
        props: Services.Identifier.SelectNotificationEmail.Props,
    ): Services.Identifier.SelectNotificationEmail.Result {
        const { transaction, input } = props;
        await this.accountRepository.findUniqueOrThrow({
            options: { lockMode: LockMode.PESSIMISTIC_WRITE },
            where: { id: input.account },
            transaction,
        });

        return await this.identifierRepository.findUniqueOrThrow({
            where: {
                type: IdentifierType.EMAIL,
                account: input.account,
                id: input.identifier,
                isVerified: true,
            },
            options: { refresh: true },
            transaction,
        });
    }

    public async togglePublicContact(
        props: Services.Identifier.TogglePublicContact.Props,
    ): Services.Identifier.TogglePublicContact.Result {
        const { transaction, input } = props;
        const identifier = await this.identifierRepository.findUniqueOrThrow({
            where: { id: input.identifier, account: input.account },
            transaction,
        });

        identifier.togglePublicContact();
    }

    public async purge(props: Services.Identifier.Purge.Props): Services.Identifier.Purge.Result {
        const { transaction, input } = props;
        await this.accountRepository.findUniqueOrThrow({
            options: { lockMode: LockMode.PESSIMISTIC_WRITE },
            where: { id: input.account },
            transaction,
        });
        const where: ORM.ObjectQuery<Entities.Identifier> = {
            account: input.account,
            id: input.identifier,
        };

        if (input.isVerified === false) {
            where.isVerified = false;
        }

        const identifier = await this.identifierRepository.findUniqueOrThrow({
            options: { populate: ["account.password"], lockMode: LockMode.PESSIMISTIC_WRITE },
            transaction,
            where,
        });

        if (identifier.isVerified) {
            const isLastVerifiedIdentifier = await this.identifierRepository.isLastVerifiedIdentifier({
                identifier: identifier.id,
                account: input.account,
                transaction,
            });

            if (isLastVerifiedIdentifier) {
                throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_REMOVE_LAST_VERIFIED` });
            }
        }

        let replacement: Nullable<Entities.Identifier> = null;
        if (identifier.type === IdentifierType.EMAIL && identifier.isVerified) {
            replacement = await this.identifierRepository.findUnique({
                where: {
                    id: { $ne: identifier.id },
                    type: IdentifierType.EMAIL,
                    account: input.account,
                    isVerified: true,
                },
                options: { orderBy: { createdAt: QueryOrder.ASC, id: QueryOrder.ASC } },
                transaction,
            });
        }

        transaction.remove(identifier);

        return { identifier, replacement };
    }
}
