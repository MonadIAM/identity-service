import { Inject, Injectable, Scope } from "@nestjs/common";

import { NOTIFICATION_REPOSITORY } from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class NotificationHandler implements Handlers.Notification.Contract {
    private readonly dictionaryPath = "handlers.notification";

    public constructor(
        @Inject(NOTIFICATION_REPOSITORY)
        private readonly notificationRepository: Repositories.Notification.Contract,
    ) {}

    public async markAsRead(props: Handlers.Notification.MarkAsRead): Promise<MessageResult> {
        await this.notificationRepository.markAsRead({
            account: props.input.account,
            id: props.input.notification,
        });

        return { message: `${this.dictionaryPath}.MARKED_AS_READ` };
    }

    public async markAllAsRead(props: Handlers.Notification.MarkAllAsRead): Promise<MessageResult> {
        const affected = await this.notificationRepository.markAsRead({
            account: props.input.account,
        });

        return {
            message: `${this.dictionaryPath}.ALL_MARKED_AS_READ`,
            params: { count: affected },
        };
    }
}
