declare namespace Commands {
    namespace OAuthClient {
        interface ControllerContract {
            create(props: Create.Props): Create.Result;
            update(props: Update.Props): Update.Result;
            revoke(props: Revoke.Props): Revoke.Result;
            restore(props: Restore.Props): Restore.Result;
            purge(props: Purge.Props): Purge.Result;
        }

        interface Contract extends ControllerContract {}

        namespace Create {
            type Props = {
                context: Extract.Meta;
                actor: string;
                realm: string;
                input: {
                    description?: string;
                    redirectUri: string;
                    name: string;
                };
            };

            type Result = Promise<MessageResult>;
        }

        namespace Update {
            type Props = {
                context: Extract.Meta;
                actor: string;
                realm: string;
                input: {
                    description?: string;
                    redirectUri?: string;
                    client: string;
                    name?: string;
                };
            };

            type Result = Promise<MessageResult>;
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
