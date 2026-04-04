import { IdentifierType } from "~context/enums";

declare global {
    namespace Commands {
        namespace Account {
            interface Contract {
                confirm: (props: Confirm.Props) => Promise<Confirm.Result>;
                deactivate: (props: Deactivate) => Promise<MessageResult>;
                unsuspend: (props: Unsuspend) => Promise<MessageResult>;
                suspend: (props: Suspend) => Promise<MessageResult>;
                create: (props: Create) => Promise<MessageResult>;
                resend: (props: Resend) => Promise<MessageResult>;
            }

            type Create = {
                context: RequestContext;
                input: {
                    displayName: string;
                    identifier: string;
                    password: string;
                };
            };

            type Resend = {
                input: {
                    identifier: string;
                };
            };

            namespace Confirm {
                type Props = {
                    context: RequestContext;
                    input: {
                        code: string;
                    };
                };

                type Result = MessageResult &
                    Services.Session.Create.Result & {
                        recoveryCodes: string[];
                    };
            }

            type SendOTP = {
                type: IdentifierType;
                account: string;
                value: string;
            };

            type Deactivate = {
                context: RequestContext;
                actor: string;
            };

            type Suspend = {
                context: RequestContext;
                actor: string;
                input: {
                    account: string;
                    reason: string;
                };
            };

            type Unsuspend = {
                context: RequestContext;
                actor: string;
                input: {
                    account: string;
                    reason: string;
                };
            };
        }
    }
}
