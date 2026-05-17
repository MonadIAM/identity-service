declare namespace Handlers {
    namespace OAuth {
        interface PrivateContract {
            resolveProvider: (props: ResolveProvider.Props) => ResolveProvider.Result;
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

            type Result = Promise<Commands.OAuth.Signup.Result | Commands.OAuth.Signin.Result>;
        }

        namespace ResolveProvider {
            type Props = {
                provider: string;
            };

            type Result = globalThis.OAuth.ResolveProvider;
        }
    }
}
