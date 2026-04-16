import { IdentifierType } from "~context/enums";

declare global {
    namespace Commands {
        namespace Account {
            interface Contract {
                deactivate: (props: Deactivate.Props) => Promise<Deactivate.Result>;
                suspend: (props: Suspend.Props) => Promise<Suspend.Result>;
                restore: (props: Restore.Props) => Promise<Restore.Result>;
                signup: (props: Signup.Props) => Promise<Signup.Result>;
                verify: (props: Verify.Props) => Promise<Verify.Result>;
                resend: (props: Resend.Props) => Promise<Resend.Result>;
            }

            namespace Deactivate {
                type Props = {
                    context: Extract.Meta;
                    actor: string;
                };

                type Result = MessageResult;
            }

            namespace Suspend {
                type Props = {
                    context: Extract.Meta;
                    actor: string;
                    input: {
                        account: string;
                        reason: string;
                    };
                };

                type Result = MessageResult;
            }

            namespace Restore {
                type Props = {
                    context: Extract.Meta;
                    actor: string;
                    input: {
                        account: string;
                        reason: string;
                    };
                };

                type Result = MessageResult;
            }

            namespace Signup {
                type Props = {
                    context: Extract.Meta;
                    input: {
                        identifier: string;
                        password: string;
                        name: string;
                    };
                };

                type Result = MessageResult;
            }

            namespace Verify {
                type Props = {
                    context: Extract.Meta;
                    input: {
                        code: string;
                    };
                };

                type Result = MessageResult &
                    Services.Session.Create.Result & {
                        codes: string[];
                    };
            }

            namespace Resend {
                type Props = {
                    input: {
                        identifier: string;
                    };
                };

                type Result = MessageResult;
            }

            type SendOTP = {
                type: IdentifierType;
                account: string;
                value: string;
            };
        }
    }
}
