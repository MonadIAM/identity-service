declare namespace Services {
    namespace RecoveryCode {
        interface Contract extends CommandContract {}

        interface CommandContract {
            regenerate: Regenerate.Signature;
            generate: Generate.Signature;
        }

        namespace Regenerate {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    account: Entities.Account;
                    hashes: string[];
                };
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Generate {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    account: Entities.Account;
                    hashes: string[];
                };
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }
    }
}
