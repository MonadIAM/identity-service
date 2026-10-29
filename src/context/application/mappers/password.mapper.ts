import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";

export class PasswordMapper implements Commands.Mappers.Password.Contract {
    public passwordChangedPayload(
        props: Commands.Mappers.Password.PasswordChangedPayload.Props,
    ): Commands.Mappers.Password.PasswordChangedPayload.Result {
        return {
            input: {
                sourceService: PlatformService.IDENTITY_SERVICE,
                template: MessageTemplate.PASSWORD_CHANGED,
                category: NotificationCategory.SECURITY,
                kind: NotificationContentKind.TEMPLATE,
                recipient: props.account,
            },
        };
    }

    public passwordChangedViaOtpPayload(
        props: Commands.Mappers.Password.PasswordChangedViaOtpPayload.Props,
    ): Commands.Mappers.Password.PasswordChangedViaOtpPayload.Result {
        return {
            input: {
                template: MessageTemplate.PASSWORD_CHANGED_VIA_OTP,
                sourceService: PlatformService.IDENTITY_SERVICE,
                category: NotificationCategory.SECURITY,
                kind: NotificationContentKind.TEMPLATE,
                recipient: props.account,
            },
        };
    }

    public passwordChangedViaRecoveryCodePayload(
        props: Commands.Mappers.Password.PasswordChangedViaRecoveryCodePayload.Props,
    ): Commands.Mappers.Password.PasswordChangedViaRecoveryCodePayload.Result {
        return {
            input: {
                template: MessageTemplate.PASSWORD_CHANGED_VIA_RECOVERY_CODE,
                sourceService: PlatformService.IDENTITY_SERVICE,
                category: NotificationCategory.SECURITY,
                kind: NotificationContentKind.TEMPLATE,
                recipient: props.account,
            },
        };
    }

    public notificationPayload(
        props: Commands.Mappers.Password.NotificationPayload.Props,
    ): Commands.Mappers.Password.NotificationPayload.Result {
        return {
            input: {
                sourceService: PlatformService.IDENTITY_SERVICE,
                template: MessageTemplate.RESET_PASSWORD_OTP,
                category: NotificationCategory.SECURITY,
                kind: NotificationContentKind.TEMPLATE,
                params: { otp: props.otp },
                recipient: props.account,
            },
        };
    }
}
