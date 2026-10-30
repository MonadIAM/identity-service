declare namespace Commands.SecondFactor {
    interface Contract extends ControllerContract {}

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
            actor?: string;
            input: ({ identifier: string } | { account: string }) & {
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
                confirmedAt?: null;
                factor: string;
            };
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }
}
