import { Inject, Injectable, Scope } from "@nestjs/common";

import { NOTIFICATION_REPOSITORY } from "~context/infrastructure/repositories";
import { HandlerException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class NotificationHandler implements Handlers.Notification.Contract {
    private readonly dictionaryPath = "handlers.notification";

    public constructor(
        @Inject(NOTIFICATION_REPOSITORY)
        private readonly notificationRepository: Repositories.Notification.Contract,
    ) {}

    public async markAsRead(props: Handlers.Notification.MarkAsRead): Promise<MessageResult> {
        try {
            await this.notificationRepository.markAsRead({
                account: props.input.account,
                id: props.input.notification,
            });

            return { message: `${this.dictionaryPath}.MARKED_AS_READ` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async markAllAsRead(props: Handlers.Notification.MarkAllAsRead): Promise<MessageResult> {
        try {
            const affected = await this.notificationRepository.markAsRead({
                account: props.input.account,
            });

            return {
                message: `${this.dictionaryPath}.ALL_MARKED_AS_READ`,
                params: { count: affected },
            };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }
}
