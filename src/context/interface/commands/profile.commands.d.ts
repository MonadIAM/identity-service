declare namespace Commands {
    namespace Profile {
        interface Contract {
            update: (props: Update) => Promise<MessageResult>;
        }

        type Update = {
            context: Extract.Meta;
            actor: string;
            input: Entities.Profile.ChangeDataProps;
        };
    }
}
