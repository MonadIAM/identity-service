declare namespace Commands.Account {
    interface Contract extends ControllerContract {}

    interface ControllerContract {
        deactivate: Deactivate.Signature;
        suspend: Suspend.Signature;
        restore: Restore.Signature;
        signup: Signup.Signature;
        verify: Verify.Signature;
        resend: Resend.Signature;
    }

    namespace Deactivate {
        type Props = {
            context: Extract.Meta;
            actor: string;
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }

    namespace Suspend {
        type Props = {
            context: Extract.Meta;
            actor: string;
            input: {
                account: string;
                reason: string;
            };
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }

    namespace Restore {
        type Props = {
            context: Extract.Meta;
            actor: string;
            input: {
                account: string;
                reason: string;
            };
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }

    namespace Signup {
        type Props = {
            context: Extract.Meta;
            input: {
                identifier: string;
                password: string;
                locale?: string;
                name: string;
            };
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }

    namespace Verify {
        type Props = {
            context: Extract.Meta;
            input: {
                code: string;
            };
        };

        type Result = Promise<
            MessageResult & {
                codes: string[];
            }
        >;

        type Signature = (props: Props) => Result;
    }

    namespace Resend {
        type Props = {
            context: Extract.Meta;
            input: {
                identifier: string;
            };
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }
}
