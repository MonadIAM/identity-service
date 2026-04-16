declare namespace Commands {
    namespace Profile {
        interface Contract {
            update: (props: Update.Props) => Promise<Update.Result>;
        }

        namespace Update {
            type Props = {
                context: Extract.Meta;
                actor: string;
                input: Entities.Profile.ChangeDataProps;
            };

            type Result = MessageResult;
        }
    }
}
