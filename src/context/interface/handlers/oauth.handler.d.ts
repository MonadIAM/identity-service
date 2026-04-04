declare namespace Handlers {
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

            type Result = Commands.OAuth.Signup.Result | Commands.OAuth.Signin.Result;
        }
    }
}
