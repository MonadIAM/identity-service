import { randomUUID } from "node:crypto";

import { Exception } from "~common/exceptions";

export class MembershipHistory implements Entities.MembershipHistory.Contract {
    private get dictionaryPath(): string {
        return "entities.membership-history";
    }

    public id: string;
    public createdAt: Date;

    public realm: string;
    public account: string;

    public invitedBy: string;
    public excludedBy?: string;

    public joinedAt: Date;
    public leaveAt?: Date;

    public constructor(props: Entities.MembershipHistory.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.invitedBy = props.invitedBy;
        this.joinedAt = props.joinedAt;
        this.account = props.account;
        this.realm = props.realm;
    }

    public close(excludedBy: string): void {
        if (this.leaveAt) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.ALREADY_CLOSED` });
        } else {
            this.excludedBy = excludedBy;
            this.leaveAt = new Date();
        }
    }
}
