declare namespace Services {
    namespace Membership {
        interface Contract extends CommandContract {}

        interface CommandContract {
            confirm: Confirm.Signature;
            exclude: Exclude.Signature;
        }

        namespace Confirm {
            type Join = {
                joinedAt: number;
                account: string;
                invite: string;
                role: string;
            };

            type Leave = {
                account: string;
            };

            type Props = {
                transaction: ORM.EntityManager;
                input: Join | Leave;
                actor: string;
                realm: string;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace Exclude {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    account: string;
                    realm: string;
                };
            };

            type Result = Promise<Entities.Membership>;

            type Signature = (props: Props) => Result;
        }
    }
}
