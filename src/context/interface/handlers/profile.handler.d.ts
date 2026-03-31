declare namespace Handlers {
    namespace Profile {
        interface Contract {
            update: (props: Update) => Promise<MessageResult>;
        }

        type Update = {
            context: RequestContext;
            actor: string;
            input: {
                patch: Entities.Profile.ChangeDataProps;
                account: string;
            };
        };
    }
}
