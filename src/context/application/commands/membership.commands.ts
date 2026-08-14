import { Inject, Injectable, Scope } from "@nestjs/common";

import { ACCOUNT_REPOSITORY, INVITE_REPOSITORY, MEMBERSHIP_REPOSITORY } from "~context/domain/repositories";
import { MembershipTopicAction, InviteStatus, EntityType, ActionType, KafkaTopic } from "~context/enums";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { Exception } from "~common/exceptions";

import { INVITE_SERVICE, MEMBERSHIP_SERVICE, MEMBERSHIP_HISTORY_SERVICE } from "../services";
import { MembershipMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class MembershipCommands implements Commands.Membership.Contract {
    private readonly mapper: Commands.Mappers.Membership.Contract;
    private readonly dictionaryPath = "commands.membership";
    private readonly resource = "Membership";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(MEMBERSHIP_REPOSITORY)
        private readonly membershipRepository: Repositories.Membership.PublicContract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.PublicContract,
        @Inject(INVITE_REPOSITORY)
        private readonly inviteRepository: Repositories.Invite.PublicContract,
        @Inject(MEMBERSHIP_HISTORY_SERVICE)
        private readonly membershipHistoryService: Services.MembershipHistory.CommandContract,
        @Inject(MEMBERSHIP_SERVICE)
        private readonly membershipService: Services.Membership.CommandContract,
        @Inject(INVITE_SERVICE)
        private readonly inviteService: Services.Invite.CommandContract,
    ) {
        this.mapper = new MembershipMapper();
    }

    public async exclude(props: Commands.Membership.Exclude.Props): Commands.Membership.Exclude.Result {
        const { actor, input, realm } = props;

        await this.transactionalService.run<Commands.Membership.Exclude.ExecuteResult>({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.leaveRequestedPayload,
                actionType: MembershipTopicAction.LEAVE_REQUESTED,
                destinationTopic: KafkaTopic.MEMBERSHIP,
            },
            audit: {
                entityType: EntityType.MEMBERSHIP,
                actionType: ActionType.EXCLUDE,
                ...props,
            },
            execute: async (transaction) => {
                const membership = await this.membershipRepository.findUnique({
                    where: { account: input.account, realm },
                    transaction,
                });

                if (membership) {
                    return { actor, input, realm };
                } else {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.MEMBERSHIP_NOT_FOUND` });
                }
            },
        });

        return { message: `${this.dictionaryPath}.EXCLUSION_REQUESTED` };
    }

    public async confirm(props: Commands.Membership.Confirm.Props): Commands.Membership.Confirm.Result {
        const { actor, realm, input } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: "invite" in input ? ActionType.ACCEPT : ActionType.EXCLUDE,
                entityType: EntityType.MEMBERSHIP,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
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
                        await this.membershipService.create({
                            transaction,
                            input: {
                                joinedAt: new Date(input.joinedAt),
                                invitedBy: actor,
                                account,
                                realm,
                            },
                        });

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
                            this.inviteService.accept({ entity: invite });
                        }
                    }
                } else {
                    await this.membershipHistoryService.close({
                        input: { account: input.account, realm, excludedBy: actor },
                        transaction,
                    });
                    await this.membershipService.revoke({
                        input: { account: input.account, realm },
                        transaction,
                    });
                }
            },
        });
    }

    public async reject(props: Commands.Membership.Reject.Props): Commands.Membership.Reject.Result {
        const { input } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.INVITE,
                actionType: ActionType.CANCEL,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const invite = await this.inviteRepository.findUniqueOrThrow({
                    where: { id: input.invite },
                    transaction,
                });

                if (invite.status === InviteStatus.PENDING) {
                    this.inviteService.cancel({ entity: invite });
                }
            },
        });
    }
}
