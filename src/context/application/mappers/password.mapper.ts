import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";

export class PasswordMapper implements Mappers.Password.Contract {
    public passwordChangedPayload(
        props: Mappers.Password.PasswordChangedPayload.Props,
    ): Mappers.Password.PasswordChangedPayload.Result {
        return {
            sourceService: PlatformService.IDENTITY_SERVICE,
            template: MessageTemplate.PASSWORD_CHANGED,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            recipient: props.account,
            language: "en",
        };
    }

    public passwordChangedViaOtpPayload(
        props: Mappers.Password.PasswordChangedViaOtpPayload.Props,
    ): Mappers.Password.PasswordChangedViaOtpPayload.Result {
        return {
            template: MessageTemplate.PASSWORD_CHANGED_VIA_OTP,
            sourceService: PlatformService.IDENTITY_SERVICE,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            recipient: props.account,
            language: "en",
        };
    }

    public passwordChangedViaRecoveryCodePayload(
        props: Mappers.Password.PasswordChangedViaRecoveryCodePayload.Props,
    ): Mappers.Password.PasswordChangedViaRecoveryCodePayload.Result {
        return {
            template: MessageTemplate.PASSWORD_CHANGED_VIA_RECOVERY_CODE,
            sourceService: PlatformService.IDENTITY_SERVICE,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            recipient: props.account,
            language: "en",
        };
    }

    public notificationPayload(
        props: Mappers.Password.NotificationPayload.Props,
    ): Mappers.Password.NotificationPayload.Result {
        return {
            sourceService: PlatformService.IDENTITY_SERVICE,
            template: MessageTemplate.RESET_PASSWORD_OTP,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            params: { otp: props.otp },
            recipient: props.account,
            language: "en",
        };
    }
}
