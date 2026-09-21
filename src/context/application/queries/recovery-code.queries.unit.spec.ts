import { describe, expect, it } from "@jest/globals";

import { RecoveryCodeQueriesUnitHelpers } from "~testing/unit/query-services/recovery-code.helpers";

const helpers = new RecoveryCodeQueriesUnitHelpers();
const ACTOR = "actor-account";

describe("RecoveryCodeQueries", () => {
    it("reads status for the requested account", async () => {
        const { queries, recoveryCodeRepository } = helpers.queries();

        await queries.getStatus({ account: ACTOR });

        expect(recoveryCodeRepository.getStatus.mock.calls).toEqual([[{ account: ACTOR }]]);
    });
});
