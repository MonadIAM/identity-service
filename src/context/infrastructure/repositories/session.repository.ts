import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { LockMode } from "@mikro-orm/postgresql";

import { Session, Account } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

import { SessionAdapter } from "../adapters";

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

        const locked = await transaction.findOne(Account, { id: account }, { lockMode: LockMode.PESSIMISTIC_WRITE });

        if (locked) {
            return transaction.find(
                Session,
                { account },
                { orderBy: [{ lastRefreshedAt: "asc" }, { createdAt: "asc" }, { id: "asc" }] },
            );
        } else {
            return [];
        }
    }
}
