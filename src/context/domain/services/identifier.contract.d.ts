declare namespace Services.Identifier {
    interface Contract extends CommandContract {}

    interface CommandContract {
        selectNotificationEmail: SelectNotificationEmail.Signature;
        togglePublicContact: TogglePublicContact.Signature;
        create: Create.Signature;
        verify: Verify.Signature;
        purge: Purge.Signature;
    }

    namespace TogglePublicContact {
        type Props = {
            transaction: ORM.EntityManager;
            input: {
                identifier: string;
                account: string;
            };
        };

        type Result = Promise<void>;

        type Signature = (props: Props) => Result;
    }

    namespace Create {
        type Props = {
            transaction: ORM.EntityManager;
            input: {
                identifier: Omit<Entities.Identifier.ConstructorProps, "account">;
                account: Entities.Account | string;
            };
        };

        type Result = Promise<Entities.Identifier>;

        type Signature = (props: Props) => Result;
    }

    namespace Verify {
        type Props = {
            transaction: ORM.EntityManager;
            input: {
                identifier: string;
                account: string;
            };
        };

        type Result = Promise<Entities.Identifier>;

        type Signature = (props: Props) => Result;
    }

    namespace SelectNotificationEmail {
        type Props = Verify.Props;

        type Result = Promise<Entities.Identifier>;

        type Signature = (props: Props) => Result;
    }

    namespace Purge {
        type Props = {
            transaction: ORM.EntityManager;
            input: {
                identifier: string;
                isVerified?: false;
                account: string;
                reason?: string;
            };
        };

        type Result = Promise<{
            replacement: Nullable<Entities.Identifier>;
            identifier: Entities.Identifier;
        }>;

        type Signature = (props: Props) => Result;
    }
}
