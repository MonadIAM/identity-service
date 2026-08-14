import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";

export class IdentifierMapper implements Commands.Mappers.Identifier.Contract {
    public identifierPurgedPayload(
        props: Commands.Mappers.Identifier.IdentifierPurgedPayload.Props,
    ): Commands.Mappers.Identifier.IdentifierPurgedPayload.Result {
        return {
            input: {
                sourceService: PlatformService.IDENTITY_SERVICE,
                template: MessageTemplate.IDENTIFIER_PURGED,
                category: NotificationCategory.SECURITY,
                kind: NotificationContentKind.TEMPLATE,
                recipient: props.account,
                language: "en",
            },
        };
    }

    public notificationPayload(
        props: Commands.Mappers.Identifier.NotificationPayload.Props,
    ): Commands.Mappers.Identifier.NotificationPayload.Result {
        return {
            input: {
                template: MessageTemplate.IDENTIFIER_VERIFICATION_OTP,
                sourceService: PlatformService.IDENTITY_SERVICE,
                category: NotificationCategory.SECURITY,
                kind: NotificationContentKind.TEMPLATE,
                params: { otp: props.otp },
                recipient: props.account,
                language: "en",
            },
        };
    }
}
