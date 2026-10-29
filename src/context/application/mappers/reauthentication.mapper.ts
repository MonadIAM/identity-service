import {
    NotificationContentKind,
    NotificationCategory,
    PlatformService,
    MessageTemplate,
    ChannelType,
} from "~context/enums";

export class ReauthenticationMapper implements Commands.Mappers.Reauthentication.Contract {
    public notificationPayload(
        props: Commands.Mappers.Reauthentication.NotificationPayload.Props,
    ): Commands.Mappers.Reauthentication.NotificationPayload.Result {
        return {
            input: {
                delivery: { channelType: ChannelType.EMAIL, address: props.address },
                template: MessageTemplate.REAUTHENTICATION_OTP,
                sourceService: PlatformService.IDENTITY_SERVICE,
                category: NotificationCategory.SECURITY,
                kind: NotificationContentKind.TEMPLATE,
                recipient: props.account,
                params: { otp: props.otp },
            },
        };
    }

    public grantPayload(
        props: Commands.Mappers.Reauthentication.GrantPayload.Props,
    ): Commands.Mappers.Reauthentication.GrantPayload.Result {
        return { session: props.session, expiresAt: props.expiresAt };
    }
}
