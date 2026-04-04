import { IdentifierType } from "~context/enums";

declare global {
    namespace Commands {
        namespace Identifier {
            interface Contract {
                create: (props: Create) => Promise<MessageResult>;
                resend: (props: Resend) => Promise<MessageResult>;
                confirm: (props: Confirm) => Promise<MessageResult>;
                purge: (props: Purge) => Promise<MessageResult>;
                toggleNotifications: (props: ToggleNotifications) => Promise<MessageResult>;
            }

            type Create = {
                context: RequestContext;
                actor: string;
                input: {
                    type: IdentifierType;
                    identifier: string;
                };
            };

            type Resend = {
                actor: string;
                input: {
                    identifier: string;
                };
            };

            type Confirm = {
                context: RequestContext;
                actor: string;
                input: {
                    code: string;
                };
            };

            type Purge = {
                context: RequestContext;
                actor: string;
                input: {
                    identifier: string;
                };
            };

            type ToggleNotifications = {
                context: RequestContext;
                actor: string;
                input: {
                    identifier: string;
                };
            };

            type SendOTP = {
                identifier: string;
                type: IdentifierType;
                value: string;
            };
        }
    }
}
