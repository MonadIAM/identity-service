declare namespace Commands {
    namespace Profile {
        interface Contract extends ControllerContract {}

        interface ControllerContract {
            update: Update.Signature;
        }

        namespace Update {
            type Props = {
                context: Extract.Meta;
                actor: string;
                input: Entities.Profile.ChangeDataProps;
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }
    }
}
