declare namespace Commands {
    namespace ServiceClient {
        interface PrivateContract {
            serviceClientPayloadMapper(props: ServiceClientPayloadMapper.Props): ServiceClientPayloadMapper.Result;
        }

        interface ControllerContract {
            create(props: Create.Props): Create.Result;
            update(props: Update.Props): Update.Result;
            revoke(props: Revoke.Props): Revoke.Result;
            restore(props: Restore.Props): Restore.Result;
            purge(props: Purge.Props): Purge.Result;
        }

        interface Contract extends PrivateContract, ControllerContract {}

        namespace Create {
            type Props = {
                context: Extract.Meta;
                actor: string;
                realm: string;
                input: {
                    description?: string;
                    application: string;
                    allowedAddresses?: string[];
                    code: string;
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
                    allowedAddresses?: string[];
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

        namespace ServiceClientPayloadMapper {
            type Props = Entities.ServiceClient | Entities.ServiceClient[];

            type Result = Topics.ServiceClient.Message["payload"] | Topics.ServiceClient.Message["payload"][];
        }
    }
}
