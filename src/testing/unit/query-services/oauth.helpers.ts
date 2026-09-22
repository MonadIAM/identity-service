import { jest } from "@jest/globals";

import { OAuthQueries } from "~context/application/queries/oauth.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class OAuthQueriesUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Queries.OAuth.Contract {
    public queries(): Unit.Queries.OAuth.Queries.Result {
        const configService = this.config({
            values: {
                JWT_ISSUER: "https://identity.example.test",
                API_VERSION: 1,
            },
        });

        const jwtService = {
            computePairwiseSubject: jest.fn<CommonServices.JWT.PublicContract["computePairwiseSubject"]>(),
        };
        const accountRepository = {
            findUniqueOrThrow: jest.fn<Repositories.Account.QueryContract["findUniqueOrThrow"]>(),
        };

        return {
            accountRepository,
            configService,
            jwtService,
            queries: new OAuthQueries(
                configService,
                this.contract<Repositories.Account.QueryContract>(accountRepository),
                this.contract<CommonServices.JWT.PublicContract>(jwtService),
            ),
        };
    }
}
