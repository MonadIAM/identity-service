declare namespace Commands {
    namespace RecoveryCode {
        interface Contract extends InternalContract, ControllerContract {}

        interface InternalContract {
            notificationPayloadMapper: NotificationPayloadMapper.Signature;
        }

        namespace NotificationPayloadMapper {
            type Props = {
                account: string;
            };

            type Result = Topics.Notification.CreateMessage["payload"];

            type Signature = (props: Props) => Result;
        }

        interface ControllerContract {
            regenerate: Regenerate.Signature;
        }

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

            type Signature = (props: Props) => Result;
        }
    }
}
