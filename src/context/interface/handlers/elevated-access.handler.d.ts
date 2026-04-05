declare namespace Handlers {
    namespace ElevatedAccess {
        interface Contract {
            bySecondFactor: (props: BySecondFactor) => Promise<MessageResult>;
            byPassword: (props: ByPassword) => Promise<MessageResult>;
        }

        type ByPassword = {
            context: RequestContext;
            actor: string;
            input: {
                password: string;
            };
        };

        type BySecondFactor = {
            context: RequestContext;
            actor: string;
            input: {
                code: string;
            };
        };
    }
}
