declare namespace Commands {
    namespace RecoveryCode {
        interface InternalContract {
            notificationPayloadMapper(props: NotificationPayloadMapper.Props): NotificationPayloadMapper.Result;
        }

        interface ControllerContract {
            regenerate(props: Regenerate.Props): Regenerate.Result;
        }

        interface Contract extends InternalContract, ControllerContract {}

        namespace Regenerate {
            type Props = {
                context: Extract.Meta;
                actor: string;
            };

            type Result = Promise<
                MessageResult & {
                    codes: string[];
                }
            >;
        }

        namespace NotificationPayloadMapper {
            type Props = {
                account: string;
            };

            type Result = Topics.Notification.CreateMessage["payload"];
        }
    }
}
