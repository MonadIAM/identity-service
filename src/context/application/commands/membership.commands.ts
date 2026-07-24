import { Inject, Injectable, Logger, Scope } from "@nestjs/common";

import { ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { MEMBERSHIP_SERVICE } from "~context/domain/services";

@Injectable({ scope: Scope.DEFAULT })
export class MembershipCommands implements Commands.Membership.Contract {
    private readonly logger = new Logger(MembershipCommands.name);

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(MEMBERSHIP_SERVICE)
        private readonly membershipService: Services.Membership.Contract,
    ) {}

    public async grant(props: Commands.Membership.Grant.Props): Commands.Membership.Grant.Result {
        const { input } = props;

        await this.transactionalService.run({
            execute: async (transaction) => {
                const account = await this.accountRepository.findUnique({
                    where: { id: input.account },
                    transaction,
                });

                if (account) {
                    await this.membershipService.create({
                        transaction,
                        input: {
                            invitedBy: input.invitedBy,
                            joinedAt: input.joinedAt,
                            realm: input.realm,
                            account,
                        },
                    });
                } else {
                    this.logger.warn(`Account not found for membership grant: account=${input.account}`);
                }
            },
        });
    }

    public async revoke(props: Commands.Membership.Revoke.Props): Commands.Membership.Revoke.Result {
        const { input } = props;

        await this.transactionalService.run({
            execute: (transaction) =>
                this.membershipService.revoke({
                    input: { account: input.account, realm: input.realm },
                    transaction,
                }),
        });
    }
}
