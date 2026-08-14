import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";

export class RecoveryCodeMapper implements Commands.Mappers.RecoveryCode.Contract {
    public notificationPayload(
        props: Commands.Mappers.RecoveryCode.NotificationPayload.Props,
    ): Commands.Mappers.RecoveryCode.NotificationPayload.Result {
        return {
            input: {
                template: MessageTemplate.RECOVERY_CODES_REGENERATED,
                sourceService: PlatformService.IDENTITY_SERVICE,
                category: NotificationCategory.SECURITY,
                kind: NotificationContentKind.TEMPLATE,
                recipient: props.account,
                language: "en",
            },
        };
    }
}
