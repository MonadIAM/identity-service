import { Inject, Injectable, Scope } from "@nestjs/common";

import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { INVITE_SERVICE } from "~context/domain/services";
import { Exception } from "~common/exceptions";
import {
    NotificationTopicAction,
    MembershipTopicAction,
    InviteStatus,
    EntityType,
    ActionType,
    KafkaTopic,
} from "~context/enums";

import { InviteMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class InviteCommands implements Commands.Invite.Contract {
    private readonly mapper: Commands.Mappers.Invite.Contract;
    private readonly dictionaryPath = "commands.invite";
    private readonly resource = "Invite";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(INVITE_SERVICE)
        private readonly inviteService: Services.Invite.CommandContract,
    ) {
        this.mapper = new InviteMapper();
    }

    public async create(props: Commands.Invite.Create.Props): Commands.Invite.Create.Result {
        const { input, actor, realm } = props;

        await this.transactionalService.run<Commands.Mappers.Invite.NotificationPayload.Props>({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.notificationPayload,
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
            },
            audit: {
                entityType: EntityType.INVITE,
                actionType: ActionType.CREATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entity = await this.inviteService.create({
                    input: { invitee: input.invitee, inviter: actor, realm, role: input.role },
                    transaction,
                });

                return { invites: [entity] };
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public changeStatus(props: Commands.Invite.ChangeStatus.Props): Commands.Invite.ChangeStatus.Result {
        switch (props.input.status) {
            case InviteStatus.ACCEPTED:
                return this.accept(props);
            case InviteStatus.DECLINED:
                return this.decline(props);
            case InviteStatus.CANCELLED:
                return this.cancel(props);
            default:
                throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.INVALID_STATUS` });
        }
    }

    public async accept(props: Commands.Invite.Accept.Props): Commands.Invite.Accept.Result {
        const { input, actor } = props;

        await this.transactionalService.run<Commands.Mappers.Invite.JoinRequestedPayload.Props>({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.joinRequestedPayload,
                actionType: MembershipTopicAction.JOIN_REQUESTED,
                destinationTopic: KafkaTopic.MEMBERSHIP,
            },
            audit: {
                actionType: ActionType.ACCEPT,
                entityType: EntityType.INVITE,
                ...props,
            },
            execute: async (transaction) => {
                const entity = await this.inviteService.accept({
                    input: { invite: input.invite, invitee: actor },
                    transaction,
                });

                return { invites: [entity] };
            },
        });

        return { message: `${this.dictionaryPath}.ACCEPTANCE_REQUESTED` };
    }

    public async cancel(props: Commands.Invite.Cancel.Props): Commands.Invite.Cancel.Result {
        const { input, actor } = props;

        await this.transactionalService.run<Commands.Mappers.Invite.NotificationCancelPayload.Props>({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.notificationCancelPayload,
                actionType: NotificationTopicAction.CANCEL,
                destinationTopic: KafkaTopic.NOTIFICATION,
            },
            audit: {
                entityType: EntityType.INVITE,
                actionType: ActionType.CANCEL,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entity = await this.inviteService.cancel({
                    input: { invite: input.invite, inviter: actor },
                    transaction,
                });

                return { invites: [entity] };
            },
        });

        return { message: `${this.dictionaryPath}.CANCELLED` };
    }

    public async decline(props: Commands.Invite.Decline.Props): Commands.Invite.Decline.Result {
        const { input, actor } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: ActionType.DECLINE,
                entityType: EntityType.INVITE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entity = await this.inviteService.decline({
                    input: { invite: input.invite, invitee: actor },
                    transaction,
                });

                return [entity];
            },
        });

        return { message: `${this.dictionaryPath}.DECLINED` };
    }
}
