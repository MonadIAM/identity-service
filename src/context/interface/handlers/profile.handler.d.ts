declare namespace Handlers {
    namespace Profile {
        interface Contract {
            update: (props: Update) => Promise<MessageResult>;
        }

        type Update = {
            input: {
                patch: Entities.Profile.ChangeDataProps;
                account: string;
            };
        };
    }
}
