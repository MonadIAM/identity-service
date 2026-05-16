declare namespace Services {
    namespace Profile {
        interface Contract {
            update: (props: Update) => void;
        }

        type Update = {
            input: {
                profile: Entities.Profile;
                patch: Entities.Profile.ChangeDataProps;
            };
        };
    }
}
