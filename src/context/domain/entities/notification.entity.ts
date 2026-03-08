import { randomUUID } from "node:crypto";

import { NotificationCategory } from "~context/enums";

import { Account } from "./account.entity";

export class Notification {
    public id: string;
    public createdAt: Date;
    public readAt?: Date;

    public category: NotificationCategory;
    public source: string;

    public title: string;
    public body: string;

    public account: Account;

    public constructor(props: Entities.Notification.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.category = props.category;
        this.source = props.source;

        this.title = props.title;
        this.body = props.body;

        this.account = props.account;
    }
}
