import { KafkaContext } from "@nestjs/microservices";
import { RealmTopicAction } from "@monadiam/shared";

declare global {
    namespace Consumers {
        namespace Realm {
            type Message = Extract<
                Topics.Realm.Message,
                { actionType: RealmTopicAction.RESTORE | RealmTopicAction.REVOKE | RealmTopicAction.PURGE }
            >;

            type Handlers = {
                [K in Message["actionType"]]: (props: {
                    incoming: TransactionManager.Service.IncomingMessage;
                    payload: Message["payload"];
                }) => Promise<void>;
            };

            interface Contract extends PublicContract, InternalContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message, context: KafkaContext) => Result;
            }

            interface InternalContract {
                process: Process.Signature;
                reject: Reject.Signature;
            }

            namespace Process {
                type Props = {
                    incoming: TransactionManager.Service.IncomingMessage;
                    message: Message;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Reject {
                type Props = {
                    incoming: TransactionManager.Service.IncomingMessage;
                    message: Message;
                    error: unknown;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace AccessCache {
            type Message = Topics.AccessCache.Message;

            interface Contract extends PublicContract, InternalContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message, context: KafkaContext) => Result;
            }

            interface InternalContract {
                process: Process.Signature;
                reject: Reject.Signature;
            }

            namespace Process {
                type Props = {
                    incoming: TransactionManager.Service.IncomingMessage;
                    message: Message;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Reject {
                type Props = {
                    incoming: TransactionManager.Service.IncomingMessage;
                    message: Message;
                    error: unknown;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace Blacklist {
            type Message = Topics.Blacklist.Message;

            interface Contract extends PublicContract, InternalContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message, context: KafkaContext) => Result;
            }

            interface InternalContract {
                process: Process.Signature;
                reject: Reject.Signature;
            }

            namespace Process {
                type Props = {
                    incoming: TransactionManager.Service.IncomingMessage;
                    message: Message;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Reject {
                type Props = {
                    incoming: TransactionManager.Service.IncomingMessage;
                    message: Message;
                    error: unknown;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace Reauthentication {
            type Message = Topics.Reauthentication.Message;

            interface Contract extends PublicContract, InternalContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message, context: KafkaContext) => Result;
            }

            interface InternalContract {
                process: Process.Signature;
                reject: Reject.Signature;
            }

            namespace Process {
                type Props = {
                    incoming: TransactionManager.Service.IncomingMessage;
                    message: Message;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Reject {
                type Props = {
                    incoming: TransactionManager.Service.IncomingMessage;
                    message: Message;
                    error: unknown;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace Retry {
            type Message = Consumers.DLQ.Message;

            interface Contract extends PublicContract, InternalContract {}

            interface PublicContract {
                handle: Handle.Signature;
            }

            namespace Handle {
                type Result = Promise<void>;

                type Signature = (message: Message, context: KafkaContext) => Result;
            }

            interface InternalContract {
                process: Process.Signature;
                reject: Reject.Signature;
            }

            namespace Process {
                type Props = {
                    context: KafkaContext;
                    message: Message;
                    event: string;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Reject {
                type Props = {
                    message: Message;
                    error: unknown;
                    event: string;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
