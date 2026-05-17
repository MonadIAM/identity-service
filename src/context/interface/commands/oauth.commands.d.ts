import { IdentifierType } from "~context/enums";

declare global {
    namespace Commands {
        namespace OAuth {
            interface PrivateContract {
                linkToExisting: (props: Link.Props) => Link.Result;
                createNew: (props: Create.Props) => Create.Result;
            }

            interface ControllerContract {
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
