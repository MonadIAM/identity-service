export class FederatedAuthnMapper implements Commands.Mappers.FederatedAuthn.Contract {
    public blacklistPayload(
        props: Commands.Mappers.FederatedAuthn.BlacklistPayload.Props,
    ): Commands.Mappers.FederatedAuthn.BlacklistPayload.Result {
        return props.revokedSessions;
    }
}
