import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";

export class AccountMapper implements Commands.Mappers.Account.Contract {
    public notificationPayload(
        props: Commands.Mappers.Account.NotificationPayload.Props,
    ): Commands.Mappers.Account.NotificationPayload.Result {
        return {
            template: MessageTemplate.ACCOUNT_VERIFICATION_OTP,
            sourceService: PlatformService.IDENTITY_SERVICE,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            params: { otp: props.otp },
            recipient: props.account,
            language: "en",
        };
    }

    public accountPayload(
        props: Commands.Mappers.Account.AccountPayload.Props,
    ): Commands.Mappers.Account.AccountPayload.Result {
        return { account: props.account.id };
    }
}
