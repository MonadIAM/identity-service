import { Identifier } from "~context/domain/entities";

declare global {
    namespace Handlers {
        namespace OAuth {
            interface Contract {
                authorize: (props: Authorize.Props) => Promise<Authorize.Result>;
                callback: (props: Callback.Props) => Promise<Callback.Result>;
            }

            namespace Authorize {
                type Props = {
                    input: {
                        provider: string;
                    };
                };

                type Result = {
                    url: string;
                };
            }

            namespace Callback {
                type Props = {
                    context: RequestContext;
                    input: {
                        provider: string;
                        state: string;
                        code: string;
                    };
                };

                type Result = {
                    refreshToken: string;
                    accessToken: string;
                    session: string;
                };
            }

            type Signup = {
                profile: Awaited<ReturnType<globalThis.OAuth.ResolveProvider["fetchProfile"]>>;
                context: RequestContext;
                provider: string;
            };

            type Login = {
                context: RequestContext;
                identifier: Identifier;
            };
        }
    }
}
