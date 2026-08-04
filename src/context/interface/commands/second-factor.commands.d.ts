declare namespace Commands {
    namespace SecondFactor {
        interface Contract extends InternalContract, ControllerContract {}

        interface InternalContract {
            secondFactorEnabledPayloadMapper: SecondFactorEnabledPayloadMapper.Signature;
            secondFactorResetPayloadMapper: SecondFactorResetPayloadMapper.Signature;
        }

        namespace SecondFactorEnabledPayloadMapper {
            type Props = {
                account: string;
            };

            type Result = Topics.Notification.CreateMessage["payload"];

            type Signature = (props: Props) => Result;
        }

        namespace SecondFactorResetPayloadMapper {
            type Props = {
                account: string;
            };

            type Result = Topics.Notification.CreateMessage["payload"];

            type Signature = (props: Props) => Result;
        }

        interface ControllerContract {
            create: Create.Signature;
            verify: Verify.Signature;
            reset: Reset.Signature;
            purge: Purge.Signature;
        }

        namespace Create {
            type Props = {
                context: Extract.Meta;
                actor: string;
                input: {
                    name: string;
                };
            };

            type Result = Promise<{
                uri: string;
                id: string;
            }>;

            type Signature = (props: Props) => Result;
        }

        namespace Verify {
            type Props = {
                context: Extract.Meta;
                actor: string;
                input: {
                    factor: string;
                    code: string;
                };
            };

            type Result = Promise<
                MessageResult & {
                    code?: string;
                }
            >;

            type Signature = (props: Props) => Result;
        }

        namespace Reset {
            type Props = {
                context: Extract.Meta;
                input: {
                    identifier: string;
                    code: string;
                };
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }

        namespace Purge {
            type Props = {
                context: Extract.Meta;
                actor: string;
                input: {
                    factor: string;
                };
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }
    }
}
