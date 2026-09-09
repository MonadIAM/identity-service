import { Inject, Injectable, Scope } from "@nestjs/common";

import { ACCOUNT_REPOSITORY, INVITE_REPOSITORY, MEMBERSHIP_REPOSITORY } from "~context/infrastructure/repositories";
import { Exception } from "~common/exceptions";
import { InviteStatus } from "~context/enums";

import { MEMBERSHIP_HISTORY_SERVICE } from "./tokens";
import { Membership } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class MembershipService implements Services.Membership.Contract {
    private readonly dictionaryPath = "services.membership";

    public constructor(
        @Inject(MEMBERSHIP_HISTORY_SERVICE)
        private readonly membershipHistoryService: Services.MembershipHistory.CommandContract,
        @Inject(MEMBERSHIP_REPOSITORY)
        private readonly membershipRepository: Repositories.Membership.PublicContract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.PublicContract,
        @Inject(INVITE_REPOSITORY)
        private readonly inviteRepository: Repositories.Invite.PublicContract,
    ) {}

    public async confirm(props: Services.Membership.Confirm.Props): Services.Membership.Confirm.Result {
        const { transaction, input, actor, realm } = props;

        if ("invite" in input) {
            const [account, invite] = await Promise.all([
                this.accountRepository.findUniqueOrThrow({
                    where: { id: input.account },
                    transaction,
                }),
                this.inviteRepository.findUniqueOrThrow({
                    where: { id: input.invite, invitee: input.account, realm, role: input.role },
                    transaction,
                }),
            ]);

            if ([InviteStatus.PENDING, InviteStatus.ACCEPTED].includes(invite.status)) {
                const existing = await this.membershipRepository.findUnique({
                    where: { account, realm },
                    transaction,
                });

                if (!existing) {
                    transaction.persist(
                        new Membership({
                            joinedAt: new Date(input.joinedAt),
                            invitedBy: actor,
                            account,
                            realm,
                        }),
                    );
                }

                await this.membershipHistoryService.create({
                    transaction,
                    input: {
                        joinedAt: new Date(input.joinedAt),
                        account: account.id,
                        invitedBy: actor,
                        realm,
                    },
                });

                if (invite.status === InviteStatus.PENDING) {
                    invite.accept();
                }
            }
        } else {
            await this.membershipHistoryService.close({
                input: { account: input.account, realm, excludedBy: actor },
                transaction,
            });

            const membership = await this.membershipRepository.findUnique({
                where: { account: input.account, realm },
                transaction,
            });

            if (membership) {
                transaction.remove(membership);
            }
        }
    }

    public async exclude(props: Services.Membership.Exclude.Props): Services.Membership.Exclude.Result {
        const { transaction, input } = props;
        const membership = await this.membershipRepository.findUnique({
            where: { account: input.account, realm: input.realm },
            transaction,
        });

        if (membership) {
            return membership;
        } else {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.MEMBERSHIP_NOT_FOUND` });
        }
    }
}
