import {
    NotificationContentKind,
    NotificationCategory,
    PlatformService,
    MessageTemplate,
    IdentifierType,
    ChannelType,
} from "~context/enums";
import { Exception } from "~common/exceptions";

export class IdentifierMapper implements Commands.Mappers.Identifier.Contract {
    private readonly dictionaryPath = "commands.identifier";

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
            },
        };
    }

    public notificationPayload(
        props: Commands.Mappers.Identifier.NotificationPayload.Props,
    ): Commands.Mappers.Identifier.NotificationPayload.Result {
        let channelType: ChannelType.EMAIL | ChannelType.SMS;

        switch (props.identifier.type) {
            case IdentifierType.EMAIL:
                channelType = ChannelType.EMAIL;
                break;
            case IdentifierType.PHONE:
                channelType = ChannelType.SMS;
                break;
            default:
                throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.UNSUPPORTED_VERIFICATION_TYPE` });
        }

        return {
            input: {
                delivery: { channelType, address: props.identifier.identity },
                template: MessageTemplate.IDENTIFIER_VERIFICATION_OTP,
                sourceService: PlatformService.IDENTITY_SERVICE,
                category: NotificationCategory.SECURITY,
                kind: NotificationContentKind.TEMPLATE,
                params: { otp: props.otp },
                recipient: props.account,
            },
        };
    }
}
