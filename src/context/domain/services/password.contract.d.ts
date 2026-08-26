declare namespace Services {
    namespace Password {
        interface Contract extends CommandContract {}

        interface CommandContract {
            rotate: Rotate.Signature;
            purge: Purge.Signature;
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

            type Signature = (props: Props) => Result;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    entries: Entities.PasswordHistory[];
                };
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }
    }
}
