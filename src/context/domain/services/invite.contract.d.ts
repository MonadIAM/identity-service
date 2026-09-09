declare namespace Services {
    namespace Invite {
        interface Contract extends CommandContract {}

        interface CommandContract {
            invalidatePending: InvalidatePending.Signature;
            decline: Decline.Signature;
            accept: Accept.Signature;
            cancel: Cancel.Signature;
            create: Create.Signature;
            expire: Expire.Signature;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    invitee: string;
                    inviter: string;
                    realm: string;
                    role: string;
                };
            };

            type Result = Promise<Entities.Invite>;

            type Signature = (props: Props) => Result;
        }

        namespace Accept {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    invitee: string;
                    invite: string;
                };
            };

            type Result = Promise<Entities.Invite>;

            type Signature = (props: Props) => Result;
        }

        namespace Decline {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    invitee: string;
                    invite: string;
                };
            };

            type Result = Promise<Entities.Invite>;

            type Signature = (props: Props) => Result;
        }

        namespace Cancel {
            type ByInviter = {
                inviter: string;
                invite: string;
            };

            type ByInvite = {
                invite: string;
            };

            type Props = {
                transaction: ORM.EntityManager;
                input: ByInviter | ByInvite;
            };

            type Result = Promise<Entities.Invite>;

            type Signature = (props: Props) => Result;
        }

        namespace InvalidatePending {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    account: string;
                };
            };

            type Result = Promise<Entities.Invite[]>;

            type Signature = (props: Props) => Result;
        }

        namespace Expire {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    expirationDate: Date;
                    batchSize: number;
                };
            };

            type Result = Promise<Entities.Invite[]>;

            type Signature = (props: Props) => Result;
        }
    }
}
