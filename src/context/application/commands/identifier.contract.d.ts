import { IdentifierType } from "~context/enums";

declare global {
    namespace Commands.Identifier {
        interface Contract extends ControllerContract {}

        interface ControllerContract {
            selectNotificationEmail: SelectNotificationEmail.Signature;
            togglePublicContact: TogglePublicContact.Signature;
            verify: Verify.Signature;
            create: Create.Signature;
            resend: Resend.Signature;
            purge: Purge.Signature;
        }

        namespace SelectNotificationEmail {
            type Props = TogglePublicContact.Props;

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
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
                context: Extract.Meta;
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
            type ExecuteResult = Awaited<Services.Identifier.Purge.Result> & { account: string };

            type Props = {
                context: Extract.Meta;
                actor: string;
                input: {
                    identifier: string;
                    isVerified?: false;
                };
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }
    }
}
