import { Inject, Injectable, Scope } from "@nestjs/common";

import { MembershipTopicAction, EntityType, ActionType, KafkaTopic } from "~context/enums";
import { INVITE_SERVICE, MEMBERSHIP_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";

import { MembershipMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class MembershipCommands implements Commands.Membership.Contract {
    private readonly mapper: Commands.Mappers.Membership.Contract;
    private readonly dictionaryPath = "commands.membership";
    private readonly resource = "Membership";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
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
                await this.membershipService.exclude({ input: { account: input.account, realm }, transaction });

                return { actor, input, realm };
            },
        });

        return { message: `${this.dictionaryPath}.EXCLUSION_REQUESTED` };
    }

    public async confirm(props: Commands.Membership.Confirm.Props): Commands.Membership.Confirm.Result {
        const { incoming, context, actor, realm, input } = props;

        await this.transactionalService.consume({
            resource: this.resource,
            audit: {
                actionType: "invite" in input ? ActionType.ACCEPT : ActionType.EXCLUDE,
                entityType: EntityType.MEMBERSHIP,
                context,
                actor,
                realm,
                input,
            },
            changeLog: true,
            incoming,
            execute: async (transaction) => {
                await this.membershipService.confirm({ transaction, input, actor, realm });
            },
        });
    }

    public async reject(props: Commands.Membership.Reject.Props): Commands.Membership.Reject.Result {
        const { incoming, context, actor, realm, input } = props;

        await this.transactionalService.consume({
            resource: this.resource,
            audit: {
                entityType: EntityType.INVITE,
                actionType: ActionType.CANCEL,
                context,
                actor,
                realm,
                input,
            },
            changeLog: true,
            incoming,
            execute: async (transaction) => {
                await this.inviteService.cancel({ input: { invite: input.invite }, transaction });
            },
        });
    }
}
