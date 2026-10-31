import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";

export class SecondFactorMapper implements Commands.Mappers.SecondFactor.Contract {
    public secondFactorEnabledPayload(
        props: Commands.Mappers.SecondFactor.SecondFactorEnabledPayload.Props,
    ): Commands.Mappers.SecondFactor.SecondFactorEnabledPayload.Result {
        return {
            input: {
                sourceService: PlatformService.IDENTITY_SERVICE,
                template: MessageTemplate.SECOND_FACTOR_ENABLED,
                category: NotificationCategory.SECURITY,
                kind: NotificationContentKind.TEMPLATE,
                recipient: props.account,
            },
        };
    }

    public secondFactorResetPayload(
        props: Commands.Mappers.SecondFactor.SecondFactorResetPayload.Props,
    ): Commands.Mappers.SecondFactor.SecondFactorResetPayload.Result {
        return {
            input: {
                sourceService: PlatformService.IDENTITY_SERVICE,
                template: MessageTemplate.SECOND_FACTOR_RESET,
                category: NotificationCategory.SECURITY,
                kind: NotificationContentKind.TEMPLATE,
                recipient: props.account,
            },
        };
    }

    public secondFactorPurgedPayload(
        props: Commands.Mappers.SecondFactor.SecondFactorPurgedPayload.Props,
    ): Commands.Mappers.SecondFactor.SecondFactorPurgedPayload.Result {
        if (props.factor?.confirmedAt) {
            return [
                {
                    input: {
                        sourceService: PlatformService.IDENTITY_SERVICE,
                        template: MessageTemplate.SECOND_FACTOR_PURGED,
                        category: NotificationCategory.SECURITY,
                        kind: NotificationContentKind.TEMPLATE,
                        recipient: props.account,
                    },
                },
            ];
        } else {
            return [];
        }
    }
}
