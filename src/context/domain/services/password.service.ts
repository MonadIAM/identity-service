import { Injectable, Scope } from "@nestjs/common";

import { PasswordHistory } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class PasswordService implements Services.Password.Contract {
    public rotate(props: Services.Password.Rotate.Props): Services.Password.Rotate.Result {
        const { transaction, input } = props;
        const previous = input.password.rotate(input.newHash);

        transaction.persist(
            new PasswordHistory({
                account: input.password.account,
                version: previous.version,
                hash: previous.hash,
            }),
        );
    }

    public purge(props: Services.Password.Purge.Props): Services.Password.Purge.Result {
        const { transaction, input } = props;
        for (const entry of input.entries) {
            transaction.remove(entry);
        }
    }
}
