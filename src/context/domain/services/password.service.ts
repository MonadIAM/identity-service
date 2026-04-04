import { Injectable, Scope } from "@nestjs/common";

import { PasswordHistory } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class PasswordService implements Services.Password.Contract {
    public rotate({ transaction, input }: Services.Password.Rotate): void {
        const previous = input.password.rotate(input.newHash);

        transaction.persist(
            new PasswordHistory({
                account: input.password.account,
                version: previous.version,
                hash: previous.hash,
            }),
        );
    }

    public purge({ transaction, input }: Services.Password.Purge): void {
        for (const entry of input.entries) {
            transaction.remove(entry);
        }
    }
}
