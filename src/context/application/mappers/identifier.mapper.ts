import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";

export class IdentifierMapper implements Mappers.Identifier.Contract {
    public identifierPurgedPayload(
        props: Mappers.Identifier.IdentifierPurgedPayload.Props,
    ): Mappers.Identifier.IdentifierPurgedPayload.Result {
        return {
            sourceService: PlatformService.IDENTITY_SERVICE,
            template: MessageTemplate.IDENTIFIER_PURGED,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            recipient: props.account,
            language: "en",
        };
    }

    public notificationPayload(
        props: Mappers.Identifier.NotificationPayload.Props,
    ): Mappers.Identifier.NotificationPayload.Result {
        return {
            template: MessageTemplate.IDENTIFIER_VERIFICATION_OTP,
            sourceService: PlatformService.IDENTITY_SERVICE,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            params: { otp: props.otp },
            recipient: props.account,
            language: "en",
        };
    }
}
