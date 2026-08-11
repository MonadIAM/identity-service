import { randomUUID } from "node:crypto";

import { InviteStatus } from "~context/enums";
import { Exception } from "~common/exceptions";

export class Invite implements Entities.Invite.Contract {
    private get dictionaryPath(): string {
        return "entities.invite";
    }

    public id: string;
    public createdAt: Date;
    public updatedAt?: Date;
    public version: number = 1;

    public status: InviteStatus;
    public invitee: Entities.Account;
    public inviter: Entities.Account;
    public realm: string;
    public role: string;

    public constructor(props: Entities.Invite.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.status = InviteStatus.PENDING;
        this.invitee = props.invitee;
        this.inviter = props.inviter;
        this.realm = props.realm;
        this.role = props.role;
    }

    public cancel(): void {
        if (this.status === InviteStatus.PENDING) {
            this.status = InviteStatus.CANCELLED;
            this.updatedAt = new Date();
        } else {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_CANCEL_INACTIVE` });
        }
    }

    public accept(): void {
        if (this.status === InviteStatus.PENDING) {
            this.status = InviteStatus.ACCEPTED;
            this.updatedAt = new Date();
        } else {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_ACCEPT_INACTIVE` });
        }
    }

    public decline(): void {
        if (this.status === InviteStatus.PENDING) {
            this.status = InviteStatus.DECLINED;
            this.updatedAt = new Date();
        } else {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_DECLINE_INACTIVE` });
        }
    }

    public invalidate(): void {
        if (this.status === InviteStatus.PENDING) {
            this.status = InviteStatus.INVALIDATED;
            this.updatedAt = new Date();
        } else {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_INVALIDATE_INACTIVE` });
        }
    }

    public expire(): void {
        if (this.status === InviteStatus.PENDING) {
            this.status = InviteStatus.EXPIRED;
            this.updatedAt = new Date();
        } else {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.CANNOT_EXPIRE_INACTIVE` });
        }
    }
}
