import { IdentifierType } from "~context/enums";

declare global {
    namespace Commands {
        namespace Account {
            interface Contract {
                confirm: (props: Confirm.Props) => Promise<Confirm.Result>;
                deactivate: (props: Deactivate) => Promise<MessageResult>;
                unsuspend: (props: Unsuspend) => Promise<MessageResult>;
                suspend: (props: Suspend) => Promise<MessageResult>;
                signup: (props: Signup) => Promise<MessageResult>;
                resend: (props: Resend) => Promise<MessageResult>;
            }

            type Signup = {
                context: Extract.Meta;
                input: {
                    identifier: string;
                    password: string;
                    name: string;
                };
            };

            type Resend = {
                input: {
                    identifier: string;
                };
            };

            namespace Confirm {
                type Props = {
                    context: Extract.Meta;
                    input: {
                        code: string;
                    };
                };

                type Result = MessageResult &
                    Services.Session.Create.Result & {
                        codes: string[];
                    };
            }

            type SendOTP = {
                type: IdentifierType;
                account: string;
                value: string;
            };

            type Deactivate = {
                context: Extract.Meta;
                actor: string;
            };

            type Suspend = {
                context: Extract.Meta;
                actor: string;
                input: {
                    account: string;
                    reason: string;
                };
            };

            type Unsuspend = {
                context: Extract.Meta;
                actor: string;
                input: {
                    account: string;
                    reason: string;
                };
            };
        }
    }
}
