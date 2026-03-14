import { IdentifierType } from "~context/enums";

declare global {
    namespace Handlers {
        namespace Identifier {
            interface Contract {
                requestAdd: (props: RequestAdd) => Promise<MessageResult>;
                confirmAdd: (props: ConfirmAdd) => Promise<MessageResult>;
                addOAuth: (props: AddOAuth) => Promise<MessageResult>;
                remove: (props: Remove) => Promise<MessageResult>;
                setPrimary: (props: SetPrimary) => Promise<MessageResult>;
                toggleNotifications: (props: ToggleNotifications) => Promise<MessageResult>;
                togglePasswordlessLogin: (props: TogglePasswordlessLogin) => Promise<MessageResult>;
            }

            type RequestAdd = {
                context: RequestContext;
                input: {
                    type: IdentifierType;
                    account: string;
                    value: string;
                };
            };

            type ConfirmAdd = {
                context: RequestContext;
                input: {
                    code: string;
                };
            };

            type AddOAuth = {
                context: RequestContext;
                input: {
                    provider: string;
                    account: string;
                    state: string;
                    code: string;
                };
            };

            type Remove = {
                context: RequestContext;
                input: {
                    identifier: string;
                    account: string;
                };
            };

            type SetPrimary = {
                context: RequestContext;
                input: {
                    identifier: string;
                    account: string;
                };
            };

            type ToggleNotifications = {
                context: RequestContext;
                input: {
                    identifier: string;
                    account: string;
                };
            };

            type TogglePasswordlessLogin = {
                context: RequestContext;
                input: {
                    identifier: string;
                    account: string;
                };
            };
        }
    }
}
