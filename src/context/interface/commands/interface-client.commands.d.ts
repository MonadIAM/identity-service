declare namespace Commands {
    namespace InterfaceClient {
        interface InternalContract {
            interfaceClientPayloadMapper(props: InterfaceClientPayloadMapper.Props): InterfaceClientPayloadMapper.Result;
        }

        interface ControllerContract {
            create(props: Create.Props): Create.Result;
            update(props: Update.Props): Update.Result;
            revoke(props: Revoke.Props): Revoke.Result;
            restore(props: Restore.Props): Restore.Result;
            purge(props: Purge.Props): Purge.Result;
        }

        interface Contract extends InternalContract, ControllerContract {}

        namespace Create {
            type Props = {
                context: Extract.Meta;
                actor: string;
                realm: string;
                input: {
                    authAddress: string;
                    description?: string;
                    application: string;
                    redirectUri: string;
                    name: string;
                };
            };

            type Result = Promise<MessageResult>;
        }

        namespace Update {
            type Props = {
                context: Extract.Meta;
                client: string;
                actor: string;
                realm: string;
                input: {
                    description?: string;
                    redirectUri?: string;
                    authAddress?: string;
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

        namespace InterfaceClientPayloadMapper {
            type Props = {
                entities: Entities.InterfaceClient[];
                isRevoked: boolean;
            };

            type Result = {
                application: string;
                isRevoked: boolean;
                realm: string;
                id: string;
            }[];
        }
    }
}
