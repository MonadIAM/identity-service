import { Inject, Injectable, Scope } from "@nestjs/common";

import { MEMBERSHIP_REPOSITORY } from "../repositories";
import { Membership } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class MembershipService implements Services.Membership.Contract {
    public constructor(
        @Inject(MEMBERSHIP_REPOSITORY)
        private readonly membershipRepository: Repositories.Membership.PublicContract,
    ) {}

    public async create(props: Services.Membership.Create.Props): Services.Membership.Create.Result {
        const { transaction, input } = props;

        const existing = await this.membershipRepository.findUnique({
            where: { account: input.account, realm: input.realm },
            transaction,
        });

        if (!existing) {
            transaction.persist(
                new Membership({
                    invitedBy: input.invitedBy,
                    joinedAt: input.joinedAt,
                    account: input.account,
                    realm: input.realm,
                }),
            );
        }
    }

    public async revoke(props: Services.Membership.Revoke.Props): Services.Membership.Revoke.Result {
        const { transaction, input } = props;

        const membership = await this.membershipRepository.findUnique({
            where: { account: input.account, realm: input.realm },
            transaction,
        });

        if (membership) {
            transaction.remove(membership);
        }
    }
}
