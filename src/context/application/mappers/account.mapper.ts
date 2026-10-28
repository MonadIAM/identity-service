import { IdentifierType } from "~context/enums";

export class AccountMapper implements Commands.Mappers.Account.Contract {
    public registrationPayload(
        props: Commands.Mappers.Account.RegistrationPayload.Props,
    ): Commands.Mappers.Account.RegistrationPayload.Result {
        return {
            account: props.account,
            locale: props.locale,
            otp: props.otp,
            identifier: {
                type: props.identifier.type === IdentifierType.EMAIL ? IdentifierType.EMAIL : IdentifierType.PHONE,
                value: props.identifier.identity,
                id: props.identifier.id,
            },
        };
    }

    public accountPayload(
        props: Commands.Mappers.Account.AccountPayload.Props,
    ): Commands.Mappers.Account.AccountPayload.Result {
        const identifier = props.account.identifiers
            .getItems()
            .find((item) => item.isVerified && (item.type === IdentifierType.EMAIL || item.type === IdentifierType.PHONE));

        return {
            account: props.account.id,
            locale: props.account.profile?.locale ?? "en",
            ...(identifier
                ? {
                      identifier: {
                          type: identifier.type === IdentifierType.EMAIL ? IdentifierType.EMAIL : IdentifierType.PHONE,
                          value: identifier.identity,
                          id: identifier.id,
                      },
                  }
                : {}),
        };
    }
}
