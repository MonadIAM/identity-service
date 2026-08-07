import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";

export class AuthnMapper implements Mappers.Authn.Contract {
    public notificationPayload(props: Mappers.Authn.NotificationPayload.Props): Mappers.Authn.NotificationPayload.Result {
        return {
            sourceService: PlatformService.IDENTITY_SERVICE,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            template: MessageTemplate.LOGIN_OTP,
            params: { otp: props.otp },
            recipient: props.account,
            language: "en",
        };
    }
}
