declare namespace Commands.Mappers.Account {
    interface Contract extends PublicContract {}

    interface PublicContract {
        registrationPayload: RegistrationPayload.Signature;
        accountPayload: AccountPayload.Signature;
    }

    namespace RegistrationPayload {
        type Props = {
            account: string;
            otp: string;
            identifier: Entities.Identifier;
        };

        type Result = Topics.Account.CreateMessage["payload"];

        type Signature = (props: Props) => Result;
    }

    namespace AccountPayload {
        type Props = {
            account: Entities.Account;
        };

        type Result = Topics.Account.VerifyMessage["payload"];

        type Signature = (props: Props) => Result;
    }
}
