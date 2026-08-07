import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";

export class SecondFactorMapper implements Mappers.SecondFactor.Contract {
    public secondFactorEnabledPayload(
        props: Mappers.SecondFactor.SecondFactorEnabledPayload.Props,
    ): Mappers.SecondFactor.SecondFactorEnabledPayload.Result {
        return {
            sourceService: PlatformService.IDENTITY_SERVICE,
            template: MessageTemplate.SECOND_FACTOR_ENABLED,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            recipient: props.account,
            language: "en",
        };
    }

    public secondFactorResetPayload(
        props: Mappers.SecondFactor.SecondFactorResetPayload.Props,
    ): Mappers.SecondFactor.SecondFactorResetPayload.Result {
        return {
            sourceService: PlatformService.IDENTITY_SERVICE,
            template: MessageTemplate.SECOND_FACTOR_RESET,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            recipient: props.account,
            language: "en",
        };
    }
}
