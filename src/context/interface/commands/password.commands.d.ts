declare namespace Commands {
    namespace Password {
        interface InternalContract {
            notificationPayloadMapper(props: NotificationPayloadMapper.Props): NotificationPayloadMapper.Result;
            findMatchingRecoveryCode(props: FindMatchingRecoveryCode.Props): FindMatchingRecoveryCode.Result;
            checkPasswordHistory(props: CheckPasswordHistory.Props): CheckPasswordHistory.Result;
        }

        interface ControllerContract {
            resetByRecoveryCode(props: ResetByRecoveryCode.Props): ResetByRecoveryCode.Result;
            requestOTP(props: RequestOTP.Props): RequestOTP.Result;
            resetByOTP(props: ResetByOTP.Props): ResetByOTP.Result;
            change(props: Change.Props): Change.Result;
        }

        interface Contract extends InternalContract, ControllerContract {}

        namespace ResetByRecoveryCode {
            type Props = {
                context: Extract.Meta;
                input: {
                    identifier: string;
                    password: string;
                    code: string;
                };
            };

            type Result = Promise<MessageResult>;
        }

        namespace RequestOTP {
            type Props = {
                input: {
                    identifier: string;
                };
            };

            type Result = Promise<MessageResult>;
        }

        namespace ResetByOTP {
            type Props = {
                context: Extract.Meta;
                input: {
                    password: string;
                    code: string;
                };
            };

            type Result = Promise<MessageResult>;
        }

        namespace Change {
            type Props = {
                context: Extract.Meta;
                actor: string;
                input: {
                    currentPassword: string;
                    newPassword: string;
                };
            };

            type Result = Promise<MessageResult>;
        }

        namespace CheckPasswordHistory {
            type Props = {
                password: string;
                account: string;
            };

            type Result = Promise<void>;
        }

        namespace FindMatchingRecoveryCode {
            type Props = {
                codes: Entities.RecoveryCode[];
                plaintext: string;
            };

            type Result = Promise<Nullable<Entities.RecoveryCode>>;
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
