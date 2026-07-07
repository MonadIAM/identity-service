declare namespace Commands {
    namespace ServiceClient {
        interface Contract {
            create(props: Create.Props): Create.Result;
            update(props: Update.Props): Update.Result;
            regenerateSecret(props: RegenerateSecret.Props): RegenerateSecret.Result;
            revoke(props: Revoke.Props): Revoke.Result;
            restore(props: Restore.Props): Restore.Result;
            purge(props: Purge.Props): Purge.Result;
        }

        namespace Create {
            type Props = {
                context: Extract.Meta;
                actor: string;
                realm: string;
                input: {
                    description?: string;
                    application: string;
                    allowedAddresses?: string[];
                    name: string;
                };
            };

            type Result = Promise<
                MessageResult & {
                    secret: string;
                }
            >;
        }

        namespace Update {
            type Props = {
                context: Extract.Meta;
                actor: string;
                realm: string;
                input: {
                    description?: string;
                    allowedAddresses?: string[];
                    client: string;
                    name?: string;
                };
            };

            type Result = Promise<MessageResult>;
        }

        namespace RegenerateSecret {
            type Props = {
                context: Extract.Meta;
                actor: string;
                realm: string;
                input: {
                    client: string;
                };
            };

            type Result = Promise<
                MessageResult & {
                    secret: string;
                }
            >;
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
        }
    }
}
