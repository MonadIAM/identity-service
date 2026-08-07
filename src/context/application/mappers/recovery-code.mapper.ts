import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";

export class RecoveryCodeMapper implements Mappers.RecoveryCode.Contract {
    public notificationPayload(
        props: Mappers.RecoveryCode.NotificationPayload.Props,
    ): Mappers.RecoveryCode.NotificationPayload.Result {
        return {
            template: MessageTemplate.RECOVERY_CODES_REGENERATED,
            sourceService: PlatformService.IDENTITY_SERVICE,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            recipient: props.account,
            language: "en",
        };
    }
}
