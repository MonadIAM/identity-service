import { IdentifierType } from "~context/enums";

declare global {
    namespace Commands {
        namespace Identifier {
            interface Contract extends InternalContract, ControllerContract {}

            interface InternalContract {
                identifierPurgedPayloadMapper: IdentifierPurgedPayloadMapper.Signature;
                notificationPayloadMapper: NotificationPayloadMapper.Signature;
            }

            namespace IdentifierPurgedPayloadMapper {
                type Props = {
                    account: string;
                };

                type Result = Topics.Notification.CreateMessage["payload"];

                type Signature = (props: Props) => Result;
            }

            namespace NotificationPayloadMapper {
                type Props = {
                    account: string;
                    otp: string;
                };

                type Result = Topics.Notification.CreateMessage["payload"];

                type Signature = (props: Props) => Result;
            }

            interface ControllerContract {
                togglePublicContact: TogglePublicContact.Signature;
                verify: Verify.Signature;
                create: Create.Signature;
                resend: Resend.Signature;
                purge: Purge.Signature;
            }

            namespace TogglePublicContact {
                type Props = {
                    context: Extract.Meta;
                    actor: string;
                    input: {
                        identifier: string;
                    };
                };

                type Result = Promise<MessageResult>;

                type Signature = (props: Props) => Result;
            }

            namespace Create {
                type Props = {
                    context: Extract.Meta;
                    actor: string;
                    input: {
                        type: IdentifierType;
                        identifier: string;
                    };
                };

                type Result = Promise<MessageResult>;

                type Signature = (props: Props) => Result;
            }

            namespace Resend {
                type Props = {
                    actor: string;
                    input: {
                        identifier: string;
                    };
                };

                type Result = Promise<MessageResult>;

                type Signature = (props: Props) => Result;
            }

            namespace Verify {
                type Props = {
                    context: Extract.Meta;
                    actor: string;
                    input: {
                        code: string;
                    };
                };

                type Result = Promise<MessageResult>;

                type Signature = (props: Props) => Result;
            }

            namespace Purge {
                type Props = {
                    context: Extract.Meta;
                    actor: string;
                    input: {
                        identifier: string;
                    };
                };

                type Result = Promise<MessageResult>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
