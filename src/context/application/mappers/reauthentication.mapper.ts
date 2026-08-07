export class ReauthenticationMapper implements Commands.Mappers.Reauthentication.Contract {
    public grantPayload(
        props: Commands.Mappers.Reauthentication.GrantPayload.Props,
    ): Commands.Mappers.Reauthentication.GrantPayload.Result {
        return { session: props.session, expiresAt: props.expiresAt };
    }
}
