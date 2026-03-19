import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { NotificationCategory, NotificationSource, IdentityActionType, IdentityEntityType } from "~context/enums";
import { AuditJournal, Notification } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class SessionService implements Services.Session.Contract {
    private readonly sessionExpiryDays: number;

    public constructor(private readonly configService: ConfigService) {
        this.sessionExpiryDays = this.configService.getOrThrow<number>("SESSION_EXPIRY_DAYS");
    }

    public create({ transaction, context: { userAgent, ip }, input }: Services.Session.Create): void {
        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.CREATE_SESSION,
            entityType: IdentityEntityType.SESSION,
            at: input.session.createdAt,
            entity: input.account.id,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "New sign-in detected",
            body: `A new sign-in was detected from ${ip}.`,
            account: input.account,
        });

        transaction.persist(input.session);
        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);
    }

    public revoke({ transaction, context: { userAgent, ip }, input }: Services.Session.Revoke): void {
        const { account } = input.session;

        transaction.remove(input.session);

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.REVOKE_SESSION,
            entityType: IdentityEntityType.SESSION,
            entity: account.id,
            at: new Date(),
            userAgent,
            ip,
        });

        transaction.persist(auditEntity);
    }

    public revokeAll({ transaction, context: { userAgent, ip }, input }: Services.Session.RevokeAll): void {
        for (const session of input.account.sessions) {
            transaction.remove(session);
        }

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.REVOKE_ALL_SESSIONS,
            entityType: IdentityEntityType.SESSION,
            entity: input.account.id,
            at: new Date(),
            userAgent,
            ip,
        });

        transaction.persist(auditEntity);
    }

    public forceLogout({ transaction, context: { userAgent, ip }, input }: Services.Session.ForceLogout): void {
        for (const session of input.account.sessions) {
            transaction.remove(session);
        }

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.FORCE_LOGOUT,
            entityType: IdentityEntityType.SESSION,
            entity: input.account.id,
            reason: input.reason,
            by: input.actor,
            at: new Date(),
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Session terminated by administrator",
            body: "All your sessions have been terminated by an administrator.",
            account: input.account,
        });

        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);
    }

    public resolveSessionExpiry(): Date {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + this.sessionExpiryDays);
        return expiry;
    }
}
