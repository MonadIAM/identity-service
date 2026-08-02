import { randomUUID } from "node:crypto";

import { IdentifierType } from "~context/enums";
import { Exception } from "~common/exceptions";

export class Identifier implements Entities.Identifier.Contract {
    private get dictionaryPath(): string {
        return "entities.identifier";
    }

    public id: string;
    public createdAt: Date;
    public verifiedAt?: Date;
    public lastUsedAt?: Date;

    public type: IdentifierType;
    public value: string;

    public providerUserId?: string;
    public provider?: string;

    public isVerified: boolean;
    public isPublicContact: boolean;

    public account: Entities.Account;

    public constructor(props: Entities.Identifier.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.isVerified = false;
        this.isPublicContact = false;

        this.type = props.type;
        this.value = props.value;

        this.providerUserId = props.providerUserId;
        this.provider = props.provider;

        this.account = props.account;
    }

    public togglePublicContact(): void {
        if (this.type === IdentifierType.OAUTH) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.PUBLIC_CONTACT_NOT_APPLICABLE` });
        } else if (this.isVerified) {
            this.isPublicContact = !this.isPublicContact;
        } else {
            throw Exception.invariantViolation({
                messageKey: `${this.dictionaryPath}.PUBLIC_CONTACT_REQUIRES_VERIFICATION`,
            });
        }
    }

    public verify(): void {
        if (this.isVerified) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.ALREADY_VERIFIED` });
        } else {
            this.verifiedAt = new Date();
            this.isVerified = true;
        }
    }
}
