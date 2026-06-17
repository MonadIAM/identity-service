declare namespace Commands {
    namespace Profile {
        interface ControllerContract {
            update(props: Update.Props): Update.Result;
        }

        interface Contract extends ControllerContract {}

        namespace Update {
            type Props = {
                context: Extract.Meta;
                actor: string;
                input: Entities.Profile.ChangeDataProps;
            };

            type Result = Promise<MessageResult>;
        }
    }
}
