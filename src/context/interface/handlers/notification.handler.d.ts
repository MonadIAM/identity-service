declare namespace Handlers {
    namespace Notification {
        interface Contract {
            markAsRead: (props: MarkAsRead) => Promise<MessageResult>;
            markAllAsRead: (props: MarkAllAsRead) => Promise<MessageResult>;
        }

        type MarkAsRead = {
            context: RequestContext;
            input: {
                notification: string;
                account: string;
            };
        };

        type MarkAllAsRead = {
            context: RequestContext;
            input: {
                account: string;
            };
        };
    }
}
