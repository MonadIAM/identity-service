import { IdentifierType } from "~context/enums";

declare global {
    namespace Commands {
        namespace Identifier {
            interface InternalContract {
                sendOTP(props: SendOTP.Props): SendOTP.Result;
            }

            interface ControllerContract {
                toggleNotifications(props: ToggleNotifications.Props): ToggleNotifications.Result;
                togglePublicContact(props: TogglePublicContact.Props): ToggleNotifications.Result;
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

            namespace ToggleNotifications {
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

            namespace SendOTP {
                type Props = {
                    identifier: string;
                    type: IdentifierType;
                    value: string;
                };

                type Result = Promise<void>;
            }
        }
    }
}
