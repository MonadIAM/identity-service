import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";

export class InviteMapper implements Commands.Mappers.Invite.Contract {
    public joinRequestedPayload(
        props: Commands.Mappers.Invite.JoinRequestedPayload.Props,
    ): Commands.Mappers.Invite.JoinRequestedPayload.Result {
        const [entity] = props.invites;

        return {
            actor: entity.inviter.id,
            realm: entity.realm,
            input: {
                account: entity.invitee.id,
                command: "invite.accept",
                process: entity.id,
                invite: entity.id,
                role: entity.role,
            },
        };
    }

    public notificationPayload(
        props: Commands.Mappers.Invite.NotificationPayload.Props,
    ): Commands.Mappers.Invite.NotificationPayload.Result {
        const [entity] = props.invites;

        return {
            actor: entity.inviter.id,
            realm: entity.realm,
            input: {
                params: { inviter: entity.inviter.id, realm: entity.realm },
                sourceService: PlatformService.IDENTITY_SERVICE,
                template: MessageTemplate.INVITE_RECEIVED,
                category: NotificationCategory.INVITES,
                kind: NotificationContentKind.TEMPLATE,
                dedupKey: `invite:${entity.id}`,
                recipient: entity.invitee.id,
                language: "en",
            },
        };
    }

    public notificationCancelPayload(
        props: Commands.Mappers.Invite.NotificationCancelPayload.Props,
    ): Commands.Mappers.Invite.NotificationCancelPayload.Result {
        const [entity] = props.invites;

        return {
            actor: entity.inviter.id,
            realm: entity.realm,
            input: {
                dedupKey: `invite:${entity.id}`,
                override: {
                    actor: entity.inviter.id,
                    realm: entity.realm,
                    input: {
                        params: { inviter: entity.inviter.id, realm: entity.realm },
                        sourceService: PlatformService.IDENTITY_SERVICE,
                        template: MessageTemplate.INVITE_CANCELLED,
                        category: NotificationCategory.INVITES,
                        kind: NotificationContentKind.TEMPLATE,
                        recipient: entity.invitee.id,
                        language: "en",
                    },
                },
            },
        };
    }
}
