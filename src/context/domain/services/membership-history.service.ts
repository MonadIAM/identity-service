import { Inject, Injectable, Scope } from "@nestjs/common";

import { MEMBERSHIP_HISTORY_REPOSITORY } from "../repositories";
import { MembershipHistory } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class MembershipHistoryService implements Services.MembershipHistory.Contract {
    public constructor(
        @Inject(MEMBERSHIP_HISTORY_REPOSITORY)
        private readonly membershipHistoryRepository: Repositories.MembershipHistory.PublicContract,
    ) {}

    public async create(props: Services.MembershipHistory.Create.Props): Services.MembershipHistory.Create.Result {
        const { transaction, input } = props;

        const existing = await this.membershipHistoryRepository.findUnique({
            where: { account: input.account, realm: input.realm, leaveAt: null },
            transaction,
        });

        if (!existing) {
            transaction.persist(
                new MembershipHistory({
                    invitedBy: input.invitedBy,
                    joinedAt: input.joinedAt,
                    account: input.account,
                    realm: input.realm,
                }),
            );
        }
    }

    public async close(props: Services.MembershipHistory.Close.Props): Services.MembershipHistory.Close.Result {
        const { transaction, input } = props;

        const entity = await this.membershipHistoryRepository.findUnique({
            where: { account: input.account, realm: input.realm, leaveAt: null },
            transaction,
        });

        if (entity) {
            entity.close(input.excludedBy);
        }
    }
}
