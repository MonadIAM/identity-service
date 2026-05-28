declare namespace Commands {
    namespace OAuth {
        type Identity = {
            provider: string;
            providerUserId: string;
            email?: string;
            emailVerified: boolean;
            profile: {
                displayName: string;
                pictureUrl?: string;
                timeZone?: string;
                locale?: string;
            };
        };

        type AuthResult = MessageResult &
            Services.Session.Create.Tokens & {
                recoveryCodes?: string[];
            };

        interface PrivateContract {
            authenticateExisting: (props: AuthenticateExisting.Props) => AuthenticateExisting.Result;
            attachToExisting: (props: AttachToExisting.Props) => AttachToExisting.Result;
            resolveProvider: (props: ResolveProvider.Props) => ResolveProvider.Result;
            provision: (props: Provision.Props) => Provision.Result;
        }

        interface ControllerContract {
            authorize: (props: Authorize.Props) => Authorize.Result;
            callback: (props: Callback.Props) => Callback.Result;
        }

        interface Contract extends PrivateContract, ControllerContract {}

        namespace Authorize {
            type Props = {
                input: {
                    provider: string;
                };
            };

            type Result = Promise<{
                url: string;
            }>;
        }

        namespace Callback {
            type Props = {
                context: Extract.Meta;
                input: {
                    provider: string;
                    state: string;
                    code: string;
                };
            };

            type Result = Promise<AuthResult>;
        }

        namespace AuthenticateExisting {
            type Props = {
                context: Extract.Meta;
                input: {
                    account: Entities.Account;
                };
            };

            type Result = Promise<AuthResult>;
        }

        namespace AttachToExisting {
            type Props = {
                context: Extract.Meta;
                input: Identity & {
                    account: Entities.Account;
                };
            };

            type Result = Promise<AuthResult>;
        }

        namespace Provision {
            type Props = {
                context: Extract.Meta;
                input: Identity;
            };

            type Result = Promise<AuthResult>;
        }

        namespace ResolveProvider {
            type Props = {
                provider: string;
            };

            type Result = globalThis.OAuth.ResolveProvider;
        }
    }
}
