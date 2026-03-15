import { EntityException } from "~common/exceptions";

import { Account } from "./account.entity";

export class Profile {
    private get dictionaryPath(): string {
        return "entities.profile";
    }

    public updatedAt?: Date;

    public displayName: string;
    public pictureUrl?: string;
    public timeZone?: string;
    public locale?: string;

    public account: Account;

    public constructor(props: Entities.Profile.ConstructorProps) {
        this.displayName = props.displayName;
        this.pictureUrl = props.pictureUrl;
        this.timeZone = props.timeZone;
        this.locale = props.locale;

        this.account = props.account;
    }

    public changeData(patch: Entities.Profile.ChangeDataProps): DeltaAudit.Patch<void> {
        const now = new Date();
        let changes: number = 0;
        for (const [key, value] of Object.typedEntries(patch)) {
            if (typeof value !== "undefined" && value !== this[key]) {
                (this[key] as unknown) = value;
                ++changes;
            }
        }

        if (changes) {
            this.updatedAt = now;
        } else if (Object.keys(patch).length) {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.NO_CHANGES_DETECTED`);
        } else {
            throw EntityException.invariantViolation(`${this.dictionaryPath}.EMPTY_UPDATE_PATCH`);
        }
    }
}
