declare namespace Services {
    namespace Identifier {
        interface Contract {
            togglePublicContact(props: TogglePublicContact.Props): TogglePublicContact.Result;
            create(props: Create.Props): Create.Result;
            verify(props: Verify.Props): Verify.Result;
            purge(props: Purge.Props): Purge.Result;
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
        }

        namespace Verify {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    identifier: Entities.Identifier;
                };
            };

            type Result = void;
        }

        namespace TogglePublicContact {
            type Props = {
                input: {
                    identifier: Entities.Identifier;
                };
            };

            type Result = void;
        }
    }
}
