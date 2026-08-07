import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";

export class SessionMapper implements Mappers.Session.Contract {
    private readonly sessionTTL: number;

    public constructor(sessionTTL: number) {
        this.sessionTTL = sessionTTL;
    }

    public notificationPayload(
        props: Mappers.Session.NotificationPayload.Props,
    ): Mappers.Session.NotificationPayload.Result {
        return {
            sourceService: PlatformService.IDENTITY_SERVICE,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            template: MessageTemplate.LOGIN_ALERT,
            recipient: props.account,
            language: "en",
        };
    }

    public blacklistPayload(props: Mappers.Session.BlacklistPayload.Props): Mappers.Session.BlacklistPayload.Result {
        if ("sessions" in props) {
            return props.sessions.map(({ id, lastRefreshedAt }) => ({
                expiresAt: Math.round(lastRefreshedAt.getTime() + this.sessionTTL * 1e3),
                session: id,
            }));
        } else {
            return props.revokedSessions;
        }
    }
}
