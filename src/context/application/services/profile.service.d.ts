import { Profile as ProfileEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace Profile {
            interface Contract {
                update: (props: Update) => void;
            }

            type Update = {
                input: {
                    profile: ProfileEntity;
                    patch: Entities.Profile.ChangeDataProps;
                };
            };
        }
    }
}
