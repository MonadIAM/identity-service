import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";

export class SessionMapper implements Commands.Mappers.Session.Contract {
    private readonly sessionTTL: number;

    public constructor(sessionTTL: number) {
        this.sessionTTL = sessionTTL;
    }

    public notificationPayload = (
        props: Commands.Mappers.Session.NotificationPayload.Props,
    ): Commands.Mappers.Session.NotificationPayload.Result => {
        return {
            input: {
                sourceService: PlatformService.IDENTITY_SERVICE,
                category: NotificationCategory.SECURITY,
                kind: NotificationContentKind.TEMPLATE,
                template: MessageTemplate.LOGIN_ALERT,
                recipient: props.account,
                language: "en",
            },
        };
    };

    public blacklistPayload = (
        props: Commands.Mappers.Session.BlacklistPayload.Props,
    ): Commands.Mappers.Session.BlacklistPayload.Result => {
        if ("sessions" in props) {
            return props.sessions.map(({ id, lastRefreshedAt }) => ({
                expiresAt: Math.round(lastRefreshedAt.getTime() + this.sessionTTL * 1e3),
                session: id,
            }));
        } else {
            return props.revokedSessions;
        }
    };

    public refreshBlacklistPayload = (
        props: Commands.Mappers.Session.RefreshBlacklistPayload.Props,
    ): Commands.Mappers.Session.RefreshBlacklistPayload.Result => {
        if (props.kind === "REUSE_DETECTED") {
            return props.sessions.map(({ id, lastRefreshedAt }) => ({
                expiresAt: Math.round(lastRefreshedAt.getTime() + this.sessionTTL * 1e3),
                session: id,
            }));
        } else {
            return [];
        }
    };
}
