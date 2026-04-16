declare namespace Commands {
    namespace Password {
        interface Contract {
            resetByRecoveryCode: (props: ResetByRecoveryCode.Props) => Promise<ResetByRecoveryCode.Result>;
            requestOTP: (props: RequestOTP.Props) => Promise<RequestOTP.Result>;
            resetByOTP: (props: ResetByOTP.Props) => Promise<ResetByOTP.Result>;
            change: (props: Change.Props) => Promise<Change.Result>;
        }

        namespace ResetByRecoveryCode {
            type Props = {
                context: Extract.Meta;
                input: {
                    identifier: string;
                    password: string;
                    code: string;
                };
            };

            type Result = MessageResult;
        }

        namespace RequestOTP {
            type Props = {
                input: {
                    identifier: string;
                };
            };

            type Result = MessageResult;
        }

        namespace ResetByOTP {
            type Props = {
                context: Extract.Meta;
                input: {
                    password: string;
                    code: string;
                };
            };

            type Result = MessageResult;
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

            type Result = MessageResult;
        }
    }
}
