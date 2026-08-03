import { IdentifierType } from "~context/enums";

declare global {
    namespace Commands {
        namespace Identifier {
            interface InternalContract {
                notificationPayloadMapper(props: NotificationPayloadMapper.Props): NotificationPayloadMapper.Result;
                identifierPurgedPayloadMapper(
                    props: IdentifierPurgedPayloadMapper.Props,
                ): IdentifierPurgedPayloadMapper.Result;
            }

            interface ControllerContract {
                togglePublicContact(props: TogglePublicContact.Props): TogglePublicContact.Result;
                verify(props: Verify.Props): Verify.Result;
                create(props: Create.Props): Create.Result;
                resend(props: Resend.Props): Resend.Pesult;
                purge(props: Purge.Props): Purge.Result;
            }

            interface Contract extends InternalContract, ControllerContract {}

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
            }

            namespace Resend {
                type Props = {
                    actor: string;
                    input: {
                        identifier: string;
                    };
                };

                type Pesult = Promise<MessageResult>;
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
            }

            namespace NotificationPayloadMapper {
                type Props = {
                    account: string;
                    otp: string;
                };

                type Result = Topics.Notification.CreateMessage["payload"];
            }

            namespace IdentifierPurgedPayloadMapper {
                type Props = {
                    account: string;
                };

                type Result = Topics.Notification.CreateMessage["payload"];
            }
        }
    }
}
