import { Injectable, Scope } from "@nestjs/common";

import { NotificationCategory, NotificationSource, IdentityActionType, IdentityEntityType } from "~context/enums";
import { AuditJournal, Notification, Session } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class SessionService implements Services.Session.Contract {
    public async create({
        transaction,
        context: { userAgent, ip },
        input: { account, hash, expiresAt },
    }: Services.Session.Create): Promise<Session> {
        const session = new Session({
            refreshTokenHash: hash,
            expiresAt,
            userAgent,
            account,
            ip,
        });

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.CREATE_SESSION,
            entityType: IdentityEntityType.SESSION,
            at: session.createdAt,
            entity: account.id,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "New sign-in detected",
            body: `A new sign-in was detected from ${ip}.`,
            account,
        });

        transaction.persist(session);
        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);

        await transaction.flush();

        return session;
    }

    public async revoke({
        transaction,
        context: { userAgent, ip },
        input: { session },
    }: Services.Session.Revoke): Promise<void> {
        const { account } = session;

        transaction.remove(session);

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.REVOKE_SESSION,
            entityType: IdentityEntityType.SESSION,
            at: new Date(),
            entity: account.id,
            userAgent,
            ip,
        });

        transaction.persist(auditEntity);

        await transaction.flush();
    }

    public async revokeAll({
        transaction,
        context: { userAgent, ip },
        input: { account },
    }: Services.Session.RevokeAll): Promise<void> {
        const sessions = await account.sessions.loadItems();

        for (const session of sessions) {
            transaction.remove(session);
        }

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.REVOKE_ALL_SESSIONS,
            entityType: IdentityEntityType.SESSION,
            at: new Date(),
            entity: account.id,
            userAgent,
            ip,
        });

        transaction.persist(auditEntity);

        await transaction.flush();
    }

    public async forceLogout({
        transaction,
        context: { userAgent, ip },
        input: { account, reason, actor },
    }: Services.Session.ForceLogout): Promise<void> {
        const sessions = await account.sessions.loadItems();

        for (const session of sessions) {
            transaction.remove(session);
        }

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.FORCE_LOGOUT,
            entityType: IdentityEntityType.SESSION,
            at: new Date(),
            entity: account.id,
            userAgent,
            by: actor,
            reason,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Session terminated by administrator",
            body: "All your sessions have been terminated by an administrator.",
            account,
        });

        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);

        await transaction.flush();
    }

    public async refresh({ transaction, input: { session, hash } }: Services.Session.Refresh): Promise<void> {
        session.refresh(hash);

        await transaction.flush();
    }
}
