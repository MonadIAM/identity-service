declare namespace Services {
    namespace Identifier {
        interface Contract extends CommandContract {}

        interface CommandContract {
            togglePublicContact: TogglePublicContact.Signature;
            create: Create.Signature;
            verify: Verify.Signature;
            purge: Purge.Signature;
        }

        namespace TogglePublicContact {
            type Props = {
                input: {
                    identifier: Entities.Identifier;
                };
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    identifier: Omit<Entities.Identifier.ConstructorProps, "account">;
                    account: Entities.Account;
                };
            };

            type Result = Entities.Identifier;

            type Signature = (props: Props) => Result;
        }

        namespace Verify {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    identifier: Entities.Identifier;
                };
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    identifier: Entities.Identifier;
                    account: string;
                    reason?: string;
                };
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }
    }
}
