declare namespace Commands {
    namespace Account {
        interface InternalContract {
            notificationPayloadMapper(props: NotificationPayloadMapper.Props): NotificationPayloadMapper.Result;
            accountPayloadMapper(props: AccountPayloadMapper.Props): AccountPayloadMapper.Result;
        }

        interface ControllerContract {
            deactivate(props: Deactivate.Props): Deactivate.Result;
            suspend(props: Suspend.Props): Suspend.Result;
            restore(props: Restore.Props): Restore.Result;
            signup(props: Signup.Props): Signup.Result;
            verify(props: Verify.Props): Verify.Result;
            resend(props: Resend.Props): Resend.Result;
        }

        interface Contract extends InternalContract, ControllerContract {}

        namespace Deactivate {
            type Props = {
                context: Extract.Meta;
                actor: string;
            };

            type Result = Promise<MessageResult>;
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

            type Result = Promise<MessageResult>;
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

            type Result = Promise<MessageResult>;
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

            type Result = Promise<MessageResult>;
        }

        namespace Verify {
            type Props = {
                context: Extract.Meta;
                input: {
                    code: string;
                };
            };

            type Result = Promise<
                MessageResult & {
                    codes: string[];
                }
            >;
        }

        namespace Resend {
            type Props = {
                input: {
                    identifier: string;
                };
            };

            type Result = Promise<MessageResult>;
        }

        namespace AccountPayloadMapper {
            type Props = Entities.Account;
            type Result = Topics.Account.Message["payload"];
        }

        namespace NotificationPayloadMapper {
            type Props = {
                account: string;
                otp: string;
            };

            type Result = Topics.Notification.Message["payload"];
        }
    }
}
