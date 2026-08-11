declare namespace Services {
    namespace Invite {
        interface Contract extends CommandContract {}

        interface CommandContract {
            invalidate: Invalidate.Signature;
            decline: Decline.Signature;
            accept: Accept.Signature;
            cancel: Cancel.Signature;
            create: Create.Signature;
            expire: Expire.Signature;
        }

        namespace Invalidate {
            type Props = {
                entity: Entities.Invite;
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Decline {
            type Props = {
                entity: Entities.Invite;
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Accept {
            type Props = {
                entity: Entities.Invite;
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Cancel {
            type Props = {
                entity: Entities.Invite;
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    invitee: Entities.Account;
                    inviter: Entities.Account;
                    realm: string;
                    role: string;
                };
            };

            type Result = Entities.Invite;

            type Signature = (props: Props) => Result;
        }

        namespace Expire {
            type Props = {
                entity: Entities.Invite;
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }
    }
}
