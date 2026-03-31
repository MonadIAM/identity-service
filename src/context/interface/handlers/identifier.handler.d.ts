import { IdentifierType } from "~context/enums";

declare global {
    namespace Handlers {
        namespace Identifier {
            interface Contract {
                create: (props: Create) => Promise<MessageResult>;
                resend: (props: Resend) => Promise<MessageResult>;
                confirm: (props: Confirm) => Promise<MessageResult>;
                purge: (props: Purge) => Promise<MessageResult>;
                setPrimary: (props: SetPrimary) => Promise<MessageResult>;
                toggleNotifications: (props: ToggleNotifications) => Promise<MessageResult>;
                togglePasswordlessLogin: (props: TogglePasswordlessLogin) => Promise<MessageResult>;
            }

            type Create = {
                context: RequestContext;
                actor: string;
                input: {
                    type: IdentifierType;
                    account: string;
                    value: string;
                };
            };

            type Resend = {
                input: {
                    identifier: string;
                    account: string;
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
                    password?: string;
                    account: string;
                };
            };

            type SetPrimary = {
                context: RequestContext;
                actor: string;
                input: {
                    identifier: string;
                    password: string;
                    account: string;
                };
            };

            type ToggleNotifications = {
                context: RequestContext;
                actor: string;
                input: {
                    identifier: string;
                    account: string;
                };
            };

            type TogglePasswordlessLogin = {
                context: RequestContext;
                actor: string;
                input: {
                    identifier: string;
                    account: string;
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
