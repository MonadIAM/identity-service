declare namespace Services {
    namespace RecoveryCode {
        interface Contract {
            regenerate(props: Regenerate.Props): Regenerate.Result;
            generate(props: Generate.Props): Generate.Result;
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
        }
    }
}
