declare namespace Handlers {
    namespace Signup {
        interface Contract {
            byEmail: (props: ByEmail) => Promise<MessageResult>;
            byPhone: (props: ByPhone) => Promise<MessageResult>;
        }

        type ByEmail = {
            context: RequestContext;
            input: {
                profile: Entities.Profile.ConstructorProps;
                password: string;
                email: string;
            };
        };

        type ByPhone = {
            context: RequestContext;
            input: {
                profile: Entities.Profile.ConstructorProps;
                password: string;
                phone: string;
            };
        };
    }
}
