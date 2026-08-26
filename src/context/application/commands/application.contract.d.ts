declare namespace Commands {
    namespace Application {
        interface Contract extends ControllerContract, ConsumerContract {}

        interface ConsumerContract {
            restoreRealm: RestoreRealm.Signature;
            revokeRealm: RevokeRealm.Signature;
            purgeRealm: PurgeRealm.Signature;
        }

        namespace RestoreRealm {
            type Props = {
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

        interface ControllerContract {
            restore: Restore.Signature;
            create: Create.Signature;
            update: Update.Signature;
            revoke: Revoke.Signature;
            purge: Purge.Signature;
        }

        namespace Restore {
            type Props = {
                context: Extract.Meta;
                actor: string;
                realm: string;
                input: {
                    applications: string[];
                };
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }

        namespace Create {
            type Props = {
                context: Extract.Meta;
                actor: string;
                realm: string;
                input: {
                    description?: string;
                    name: string;
                };
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }

        namespace Update {
            type Props = {
                context: Extract.Meta;
                actor: string;
                realm: string;
                input: {
                    description?: string;
                    application: string;
                    name?: string;
                };
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }

        namespace Revoke {
            type Props = {
                context: Extract.Meta;
                actor: string;
                realm: string;
                input: {
                    applications: string[];
                };
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }

        namespace Purge {
            type Props = {
                context: Extract.Meta;
                actor: string;
                realm: string;
                input: {
                    applications: string[];
                };
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }
    }
}
