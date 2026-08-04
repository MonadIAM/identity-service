import { Inject, Injectable, Scope } from "@nestjs/common";

import { Exception } from "~common/exceptions";

import { IDENTIFIER_REPOSITORY } from "../repositories";
import { Identifier } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class IdentifierService implements Services.Identifier.Contract {
    private readonly dictionaryPath = "services.identifier";

    public constructor(
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.PublicContract,
    ) {}

    public create(props: Services.Identifier.Create.Props): Services.Identifier.Create.Result {
        const { transaction, input } = props;
        const identifierEntity = new Identifier({
            providerUserId: input.identifier.providerUserId,
            provider: input.identifier.provider,
            value: input.identifier.value,
            type: input.identifier.type,
            account: input.account,
        });

        transaction.persist(identifierEntity);

        return identifierEntity;
    }

    public verify(props: Services.Identifier.Verify.Props): Services.Identifier.Verify.Result {
        const { input } = props;
        input.identifier.verify();
    }

    public togglePublicContact(
        props: Services.Identifier.TogglePublicContact.Props,
    ): Services.Identifier.TogglePublicContact.Result {
        const { input } = props;
        input.identifier.togglePublicContact();
    }

    public async purge(props: Services.Identifier.Purge.Props): Services.Identifier.Purge.Result {
        const { transaction, input } = props;
        const isLastVerifiedIdentifier = await this.identifierRepository.isLastVerifiedIdentifier({
            identifier: input.identifier.id,
            account: input.account,
            transaction,
        });

        if (isLastVerifiedIdentifier) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_REMOVE_LAST_VERIFIED` });
        } else {
            transaction.remove(input.identifier);
        }
    }
}
