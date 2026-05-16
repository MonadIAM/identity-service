import { IdentifierType } from "~context/enums";

declare global {
    namespace Commands {
        namespace OAuth {
            interface Contract {
                signup: (props: Signup.Props) => Promise<Signup.Result>;
                signin: (props: Signin.Props) => Promise<Signin.Result>;
            }

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

                type Result = MessageResult &
                    Services.Session.Create.Result & {
                        recoveryCodes?: string[];
                    };
            }

            namespace Signin {
                type Props = {
                    context: Extract.Meta;
                    input: {
                        account: Entities.Account;
                    };
                };

                type Result = MessageResult & Services.Session.Create.Result;
            }

            type Link = Signup.Props & {
                identifier: Entities.Identifier;
            };
        }
    }
}
