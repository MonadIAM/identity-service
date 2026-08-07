declare namespace Mappers {
    namespace SecondFactor {
        interface Contract extends PublicContract {}

        interface PublicContract {
            secondFactorEnabledPayload: SecondFactorEnabledPayload.Signature;
            secondFactorResetPayload: SecondFactorResetPayload.Signature;
        }

        namespace SecondFactorEnabledPayload {
            type Props = {
                account: string;
            };

            type Result = Topics.Notification.CreateMessage["payload"];

            type Signature = (props: Props) => Result;
        }

        namespace SecondFactorResetPayload {
            type Props = {
                account: string;
            };

            type Result = Topics.Notification.CreateMessage["payload"];

            type Signature = (props: Props) => Result;
        }
    }
}
