export class FederatedAuthnMapper implements Mappers.FederatedAuthn.Contract {
    public blacklistPayload(
        props: Mappers.FederatedAuthn.BlacklistPayload.Props,
    ): Mappers.FederatedAuthn.BlacklistPayload.Result {
        return props.revokedSessions;
    }
}
