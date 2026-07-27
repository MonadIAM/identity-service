import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { SessionAdapter } from "~context/infrastructure/adapters";
import { Session } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

@Injectable({ scope: Scope.DEFAULT })
export class SessionRepository
    extends BaseRepository<Entities.Session, Adapters.Session.Types>({
        Adapter: SessionAdapter,
        Entity: Session,
    })
    implements Repositories.Session.Contract
{
    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
    ) {
        super();
    }

    public async lockByAccount(props: Repositories.Session.LockByAccount.Props): Promise<Entities.Session[]> {
        const { transaction, account } = props;
        const rows = await transaction
            .getKnex()
            .with("locked_account", (builder) => {
                builder.select("id").from("identity.account").where("id", account).forUpdate();
            })
            .select("session.*")
            .from("identity.session as session")
            .join("locked_account", "session.account_id", "locked_account.id")
            .orderBy([
                { column: "session.last_refreshed_at", order: "asc" },
                { column: "session.created_at", order: "asc" },
                { column: "session.id", order: "asc" },
            ]);

        return rows.map((row) => transaction.map(Session, row));
    }
}
