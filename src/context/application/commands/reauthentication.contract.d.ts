declare namespace Commands.Reauthentication {
    interface Contract extends ControllerContract, InternalContract {}

    interface InternalContract {
        resolveEmail: ResolveEmail.Signature;
    }

    namespace ResolveEmail {
        type Props = {
            transaction: ORM.EntityManager;
            actor: string;
        };

        type Result = Promise<Entities.Identifier>;

        type Signature = (props: Props) => Result;
    }

    interface ControllerContract {
        bySecondFactor: BySecondFactor.Signature;
        byPassword: ByPassword.Signature;
        requestOTP: RequestOTP.Signature;
        byOTP: ByOTP.Signature;
    }

    namespace RequestOTP {
        type Props = {
            context: Extract.Meta;
            session: string;
            actor: string;
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }

    namespace ByOTP {
        type Props = {
            context: Extract.Meta;
            session: string;
            actor: string;
            input: {
                code: string;
            };
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }

    namespace BySecondFactor {
        type Props = {
            context: Extract.Meta;
            session: string;
            actor: string;
            input: {
                code: string;
            };
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }

    namespace ByPassword {
        type Props = {
            context: Extract.Meta;
            session: string;
            actor: string;
            input: {
                password: string;
            };
        };

        type Result = Promise<MessageResult>;

        type Signature = (props: Props) => Result;
    }
}
