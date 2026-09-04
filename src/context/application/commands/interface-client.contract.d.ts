declare namespace Commands {
    namespace InterfaceClient {
        interface Contract extends ControllerContract {}

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
                    clients: string[];
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
                    authAddress: string;
                    application: string;
                    description?: string;
                    redirectUris: string[];
                    name: string;
                };
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }

        namespace Update {
            type Props = {
                context: Extract.Meta;
                client: string;
                actor: string;
                realm: string;
                input: {
                    redirectUris?: string[];
                    description?: string;
                    authAddress?: string;
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
                    clients: string[];
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
                    clients: string[];
                };
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }
    }
}
