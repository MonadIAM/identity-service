declare namespace Commands {
    namespace Realm {
        interface Contract extends ConsumerContract {}

        interface ConsumerContract {
            restoreRealm: RestoreRealm.Signature;
            revokeRealm: RevokeRealm.Signature;
            purgeRealm: PurgeRealm.Signature;
        }

        namespace RestoreRealm {
            type Props = {
                incoming: TransactionManager.Service.IncomingMessage;
                actor: string;
                realm: string;
                context: Extract.Meta;
                input: {
                    version: number;
                };
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace RevokeRealm {
            type Props = {
                incoming: TransactionManager.Service.IncomingMessage;
                actor: string;
                realm: string;
                context: Extract.Meta;
                input: {
                    version: number;
                };
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace PurgeRealm {
            type Props = {
                incoming: TransactionManager.Service.IncomingMessage;
                actor: string;
                realm: string;
                context: Extract.Meta;
                input: {
                    version: number;
                };
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }
    }
}
