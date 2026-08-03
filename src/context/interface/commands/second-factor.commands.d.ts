declare namespace Commands {
    namespace SecondFactor {
        interface InternalContract {
            secondFactorEnabledPayloadMapper(
                props: SecondFactorEnabledPayloadMapper.Props,
            ): SecondFactorEnabledPayloadMapper.Result;
            secondFactorResetPayloadMapper(
                props: SecondFactorResetPayloadMapper.Props,
            ): SecondFactorResetPayloadMapper.Result;
        }

        interface ControllerContract {
            create(props: Create.Props): Create.Result;
            verify(props: Verify.Props): Verify.Result;
            purge(props: Purge.Props): Purge.Result;
            reset(props: Reset.Props): Reset.Result;
        }

        interface Contract extends InternalContract, ControllerContract {}

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
        }

        namespace SecondFactorEnabledPayloadMapper {
            type Props = {
                account: string;
            };

            type Result = Topics.Notification.CreateMessage["payload"];
        }

        namespace SecondFactorResetPayloadMapper {
            type Props = {
                account: string;
            };

            type Result = Topics.Notification.CreateMessage["payload"];
        }
    }
}
