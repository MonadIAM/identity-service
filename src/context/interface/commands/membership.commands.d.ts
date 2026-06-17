declare namespace Commands {
    namespace Membership {
        interface Contract {
            revoke(props: Revoke.Props): Revoke.Result;
            grant(props: Grant.Props): Grant.Result;
        }

        namespace Grant {
            type Props = {
                input: {
                    invitedBy: string;
                    account: string;
                    joinedAt: Date;
                    realm: string;
                };
            };

            type Result = Promise<void>;
        }

        namespace Revoke {
            type Props = {
                input: {
                    account: string;
                    realm: string;
                };
            };

            type Result = Promise<void>;
        }
    }
}
