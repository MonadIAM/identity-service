declare namespace Commands {
    namespace ServiceClient {
        interface Contract extends InternalContract, ControllerContract {}

        interface InternalContract {
            serviceClientPayloadMapper: ServiceClientPayloadMapper.Signature;
        }

        namespace ServiceClientPayloadMapper {
            type Props = Entities.ServiceClient | Entities.ServiceClient[];

            type Result = Topics.ServiceClient.Message["payload"] | Topics.ServiceClient.Message["payload"][];

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
                    description?: string;
                    application: string;
                    allowedAddresses?: string[];
                    code: string;
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
                    allowedAddresses?: string[];
                    client: string;
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
