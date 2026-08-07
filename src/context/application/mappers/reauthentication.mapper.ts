export class ReauthenticationMapper implements Mappers.Reauthentication.Contract {
    public grantPayload(props: Mappers.Reauthentication.GrantPayload.Props): Mappers.Reauthentication.GrantPayload.Result {
        return { session: props.session, expiresAt: props.expiresAt };
    }
}
