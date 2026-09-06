import { randomUUID } from "node:crypto";

import { SecondFactorType } from "~context/enums";
import { Exception } from "~common/exceptions";

export class SecondFactor implements Entities.SecondFactor.Contract {
    private static readonly dictionaryPath = "entities.second-factor";

    public id: string;
    public createdAt: Date;
    public confirmedAt?: Date;
    public lastAcceptedTOTPStep?: number;

    public type: SecondFactorType;
    public secret: string;
    public name: string;

    public account: Entities.Account;

    public constructor(props: Entities.SecondFactor.ConstructorProps) {
        this.createdAt = new Date();
        this.id = randomUUID();

        this.secret = props.secret;
        this.name = props.name;
        this.type = props.type;

        this.account = props.account;
    }

    public confirm(): void {
        if (this.confirmedAt) {
            throw Exception.invariantViolation({ messageKey: `${SecondFactor.dictionaryPath}.CONFIRM_NOT_ALLOWED` });
        } else {
            this.confirmedAt = new Date();
        }
    }

    public rewrap(secret: string): void {
        this.secret = secret;
    }

    public acceptTOTP(step: number): boolean {
        if (this.lastAcceptedTOTPStep !== undefined && step <= this.lastAcceptedTOTPStep) {
            return false;
        } else {
            this.lastAcceptedTOTPStep = step;
            return true;
        }
    }
}
