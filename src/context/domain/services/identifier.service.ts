import { Inject, Injectable, Scope } from "@nestjs/common";
import { LockMode } from "@mikro-orm/postgresql";
import { isString } from "class-validator";

import { IDENTIFIER_REPOSITORY, ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
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
        const identifier = await this.identifierRepository.findUniqueOrThrow({
            where: { id: input.identifier },
            transaction,
        });

        if (identifier.isVerified) {
            throw Exception.conflict({ messageKey: `${this.dictionaryPath}.ALREADY_VERIFIED` });
        } else {
            identifier.verify();
        }
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

        transaction.remove(identifier);
    }
}
