import { SecondFactorType } from "~context/enums";

declare global {
    namespace Entities {
        type SecondFactor = SecondFactor.Contract;

        namespace SecondFactor {
            interface Contract {
                id: string;
                createdAt: Date;
                confirmedAt?: Date;
                lastAcceptedTOTPStep?: number;

                type: SecondFactorType;
                secret: string;
                name: string;

                account: Entities.Account;

                acceptTOTP(step: number): boolean;
                rewrap(secret: string): void;
                confirm(): void;
            }

            type ConstructorProps = {
                account: Entities.Account;
                type: SecondFactorType;
                secret: string;
                name: string;
            };
        }
    }
}
