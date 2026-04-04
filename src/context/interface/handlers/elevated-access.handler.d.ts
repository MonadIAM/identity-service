declare namespace Handlers {
    namespace ElevatedAccess {
        interface Contract {
            byPassword: (props: ByPassword) => Promise<MessageResult>;
            byTOTP: (props: ByTOTP) => Promise<MessageResult>;
        }

        type ByPassword = {
            context: RequestContext;
            actor: string;
            input: {
                password: string;
            };
        };

        type ByTOTP = {
            context: RequestContext;
            actor: string;
            input: {
                code: string;
            };
        };
    }
}
