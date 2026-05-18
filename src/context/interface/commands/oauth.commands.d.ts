import { IdentifierType } from "~context/enums";

declare global {
    namespace Commands {
        namespace OAuth {
            interface PrivateContract {
                resolveProvider: (props: ResolveProvider.Props) => ResolveProvider.Result;
                linkToExisting: (props: Link.Props) => Link.Result;
                createNew: (props: Create.Props) => Create.Result;
            }

            interface ControllerContract {
                authorize: (props: Authorize.Props) => Authorize.Result;
                callback: (props: Callback.Props) => Callback.Result;
                signup: (props: Signup.Props) => Signup.Result;
                signin: (props: Signin.Props) => Signin.Result;
            }

            interface Contract extends PrivateContract, ControllerContract {}

            namespace Signup {
                type Props = {
                    context: Extract.Meta;
                    input: {
                        oauth: {
                            providerUserId: string;
                            provider: string;
                            value: string;
                            type: IdentifierType;
                        };
                        profile: {
                            displayName: string;
                            timeZone?: string;
                            locale?: string;
                        };
                        email?: string;
                    };
                };

                type Result = Promise<
                    MessageResult &
                        Awaited<Services.Session.Create.Result> & {
                            recoveryCodes?: string[];
                        }
                >;
            }

            namespace Signin {
                type Props = {
                    context: Extract.Meta;
                    input: {
                        account: Entities.Account;
                    };
                };

                type Result = Promise<MessageResult & Awaited<Services.Session.Create.Result>>;
            }

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

            namespace Link {
                type Props = Signup.Props & {
                    identifier: Entities.Identifier;
                };

                type Result = OAuth.Signup.Result;
            }

            namespace Create {
                type Result = OAuth.Signup.Result;
                type Props = OAuth.Signup.Props;
            }
        }
    }
}
