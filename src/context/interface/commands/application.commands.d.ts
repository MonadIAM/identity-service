declare namespace Commands {
    namespace Application {
        interface ControllerContract {
            create(props: Create.Props): Create.Result;
            update(props: Update.Props): Update.Result;
            revoke(props: Revoke.Props): Revoke.Result;
            restore(props: Restore.Props): Restore.Result;
            purge(props: Purge.Props): Purge.Result;
        }

        interface ConsumerContract {
            revokeRealm(props: RevokeRealm.Props): RevokeRealm.Result;
            restoreRealm(props: RestoreRealm.Props): RestoreRealm.Result;
            purgeRealm(props: PurgeRealm.Props): PurgeRealm.Result;
        }

        interface PrivateContract {
            interfaceClientOutboxPayloadMapper(
                props: InterfaceClientOutboxPayloadMapper.Props,
            ): InterfaceClientOutboxPayloadMapper.Result;
            serviceClientOutboxPayloadMapper(
                entities: ServiceClientOutboxPayloadMapper.Props,
            ): ServiceClientOutboxPayloadMapper.Result;
        }

        interface Contract extends PrivateContract, ControllerContract, ConsumerContract {}

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
        }

        namespace RevokeRealm {
            type Props = {
                version: number;
                realm: string;
            };

            type Result = Promise<void>;
        }

        namespace RestoreRealm {
            type Props = {
                version: number;
                realm: string;
            };

            type Result = Promise<void>;
        }

        namespace PurgeRealm {
            type Props = {
                version: number;
                realm: string;
            };

            type Result = Promise<void>;
        }

        namespace InterfaceClientOutboxPayloadMapper {
            type Props = {
                entities: Entities.Application[];
                isRevoked: boolean;
            };

            type Result = {
                applicationId: string;
                realm: string;
                isRevoked: boolean;
                id: string;
            }[];
        }

        namespace ServiceClientOutboxPayloadMapper {
            type Props = Entities.Application[];

            type Result = {
                applicationId: string;
                code: string;
                id: string;
            }[];
        }
    }
}
