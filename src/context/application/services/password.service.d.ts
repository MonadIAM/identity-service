declare namespace Services {
    namespace Password {
        interface Contract {
            rotate(props: Rotate.Props): Rotate.Result;
            purge(props: Purge.Props): Purge.Result;
        }

        namespace Rotate {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    password: Entities.Password;
                    newHash: string;
                };
            };

            type Result = void;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    entries: Entities.PasswordHistory[];
                };
            };

            type Result = void;
        }
    }
}
