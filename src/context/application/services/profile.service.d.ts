declare namespace Services {
    namespace Profile {
        interface Contract {
            update(props: Update.Props): Update.Result;
        }

        namespace Update {
            type Props = {
                input: {
                    profile: Entities.Profile;
                    patch: Entities.Profile.ChangeDataProps;
                };
            };

            type Result = void;
        }
    }
}
