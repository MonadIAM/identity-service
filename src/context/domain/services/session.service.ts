import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { NotificationCategory, NotificationSource } from "~context/enums";
import { Notification } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class SessionService implements Services.Session.Contract {
    private readonly sessionExpiryDays: number;

    public constructor(private readonly configService: ConfigService) {
        this.sessionExpiryDays = this.configService.getOrThrow<number>("SESSION_EXPIRY_DAYS");
    }

    public create({ transaction, context: { ip }, input }: Services.Session.Create): void {
        transaction.persist(input.session);

        transaction.persist(
            new Notification({
                category: NotificationCategory.SECURITY,
                source: NotificationSource.IDENTITY,
                title: "New sign-in detected",
                body: `A new sign-in was detected from ${ip}.`,
                account: input.account,
            }),
        );
    }

    public revoke({ transaction, input }: Services.Session.Revoke): void {
        transaction.remove(input.session);
    }

    public revokeAll({ transaction, input }: Services.Session.RevokeAll): void {
        for (const session of input.account.sessions) {
            transaction.remove(session);
        }
    }

    public forceLogout({ transaction, input }: Services.Session.ForceLogout): void {
        for (const session of input.account.sessions) {
            transaction.remove(session);
        }

        transaction.persist(
            new Notification({
                category: NotificationCategory.SECURITY,
                source: NotificationSource.IDENTITY,
                title: "Session terminated by administrator",
                body: "All your sessions have been terminated by an administrator.",
                account: input.account,
            }),
        );
    }

    public resolveSessionExpiry(): Date {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + this.sessionExpiryDays);
        return expiry;
    }
}
