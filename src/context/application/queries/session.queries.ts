import { Inject, Injectable, Scope } from "@nestjs/common";

import { SESSION_REPOSITORY } from "~context/domain/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class SessionQueries implements Queries.Session.Contract {
    public constructor(
        @Inject(SESSION_REPOSITORY)
        private readonly sessionRepository: Repositories.Session.QueryContract,
    ) {}

    public getCurrent(props: Queries.Session.GetCurrent.Props): Queries.Session.GetCurrent.Result {
        return this.sessionRepository.findUniqueOrThrow({
            where: { id: props.session, account: props.account },
        });
    }

    public findMany(props: Queries.Session.FindMany.Props): Queries.Session.FindMany.Result {
        return this.sessionRepository.findMany({
            where: { account: props.account },
        });
    }
}
