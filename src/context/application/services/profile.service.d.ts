declare namespace Services {
    namespace Profile {
        interface Contract extends CommandContract {}

        interface CommandContract {
            update: Update.Signature;
        }

        namespace Update {
            type Props = {
                input: {
                    profile: Entities.Profile;
                    patch: Entities.Profile.ChangeDataProps;
                };
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }
    }
}
