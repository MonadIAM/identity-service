import { Inject, Injectable, Scope } from "@nestjs/common";

import { SESSION_REPOSITORY } from "~context/infrastructure/repositories";
import { Session } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class SessionQueries implements Queries.Session.Contract {
    public constructor(
        @Inject(SESSION_REPOSITORY)
        private readonly sessionRepository: Repositories.Session.Contract,
    ) {}

    public getCurrent(props: Queries.Session.GetCurrent): Promise<Session> {
        return this.sessionRepository.findUniqueOrThrow({
            where: { id: props.session, account: props.account },
        });
    }

    public findMany(props: Queries.Session.FindMany): Promise<[Session[], number]> {
        return this.sessionRepository.findMany({
            where: { account: props.account },
        });
    }
}
