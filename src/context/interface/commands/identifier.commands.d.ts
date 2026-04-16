import { IdentifierType } from "~context/enums";

declare global {
    namespace Commands {
        namespace Identifier {
            interface Contract {
                toggleNotifications: (props: ToggleNotifications.Props) => Promise<ToggleNotifications.Result>;
                togglePublicContact: (props: TogglePublicContact.Props) => Promise<ToggleNotifications.Result>;
                verify: (props: Verify.Props) => Promise<MessageResult>;
                create: (props: Create.Props) => Promise<Create.Result>;
                resend: (props: Resend.Props) => Promise<Resend.Pesult>;
                purge: (props: Purge.Props) => Promise<Purge.Result>;
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

                type Result = MessageResult;
            }

            namespace Resend {
                type Props = {
                    actor: string;
                    input: {
                        identifier: string;
                    };
                };

                type Pesult = MessageResult;
            }

            namespace Verify {
                type Props = {
                    context: Extract.Meta;
                    actor: string;
                    input: {
                        code: string;
                    };
                };

                type Result = MessageResult;
            }

            namespace Purge {
                type Props = {
                    context: Extract.Meta;
                    actor: string;
                    input: {
                        identifier: string;
                    };
                };

                type Result = MessageResult;
            }

            namespace ToggleNotifications {
                type Props = {
                    context: Extract.Meta;
                    actor: string;
                    input: {
                        identifier: string;
                    };
                };

                type Result = MessageResult;
            }

            namespace TogglePublicContact {
                type Props = {
                    context: Extract.Meta;
                    actor: string;
                    input: {
                        identifier: string;
                    };
                };

                type Result = MessageResult;
            }

            type SendOTP = {
                identifier: string;
                type: IdentifierType;
                value: string;
            };
        }
    }
}
