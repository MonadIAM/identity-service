declare namespace Handlers {
    namespace Signup {
        interface Contract {
            byEmail: (props: ByEmail) => Promise<MessageResult>;
            byPhone: (props: ByPhone) => Promise<MessageResult>;
        }

        type ByEmail = {
            context: RequestContext;
            input: {
                displayName: string;
                password: string;
                email: string;
            };
        };

        type ByPhone = {
            context: RequestContext;
            input: {
                displayName: string;
                password: string;
                phone: string;
            };
        };
    }
}
