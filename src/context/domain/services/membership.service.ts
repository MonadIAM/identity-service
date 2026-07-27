import { Inject, Injectable, Logger, Scope } from "@nestjs/common";

import { MEMBERSHIP_REPOSITORY } from "../repositories";
import { Membership } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class MembershipService implements Services.Membership.Contract {
    private readonly logger = new Logger(MembershipService.name);

    public constructor(
        @Inject(MEMBERSHIP_REPOSITORY)
        private readonly membershipRepository: Repositories.Membership.Contract,
    ) {}

    public async create(props: Services.Membership.Create.Props): Services.Membership.Create.Result {
        const { transaction, input } = props;

        const existing = await this.membershipRepository.findUnique({
            where: { account: input.account, realm: input.realm },
            transaction,
        });

        if (existing) {
            this.logger.warn(`Membership already exists for account=${input.account.id} realm=${input.realm}`);
        } else {
            const membership = new Membership({
                invitedBy: input.invitedBy,
                joinedAt: input.joinedAt,
                account: input.account,
                realm: input.realm,
            });
            transaction.persist(membership);
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
        } else {
            this.logger.warn(`Membership not found for account=${input.account} realm=${input.realm}`);
        }
    }
}
