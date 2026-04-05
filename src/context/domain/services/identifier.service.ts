import { Inject, Injectable, Scope } from "@nestjs/common";

import { IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { Identifier } from "~context/domain/entities";
import { ServiceException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class IdentifierService implements Services.Identifier.Contract {
    private readonly dictionaryPath = "services.identifier";

    public constructor(
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.Contract,
    ) {}

    public create({ transaction, input }: Services.Identifier.Create): Identifier {
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

    public verify({ input }: Services.Identifier.Verify): void {
        input.identifier.verify();
    }

    public toggleNotifications({ input }: Services.Identifier.ToggleNotifications): void {
        input.identifier.toggleNotifications();
    }

    public togglePublicContact({ input }: Services.Identifier.TogglePublicContact): void {
        input.identifier.togglePublicContact();
    }

    public async purge({ transaction, input }: Services.Identifier.Purge): Promise<void> {
        const isLastVerifiedIdentifier = await this.identifierRepository.isLastVerifiedIdentifier({
            identifier: input.identifier.id,
            account: input.account,
            transaction,
        });

        if (isLastVerifiedIdentifier) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.CANNOT_REMOVE_LAST_VERIFIED`);
        } else {
            transaction.remove(input.identifier);
        }
    }
}
