import { describe, expect, it } from "@jest/globals";

import { RecoveryCodeQueriesUnitHelpers } from "~testing/unit/query-services/recovery-code.helpers";

const helpers = new RecoveryCodeQueriesUnitHelpers();
const ACTOR = "actor-account";

describe("[Queries] - RecoveryCode", () => {
    describe("[Method] - getStatus", () => {
        it("[case] - reads status for the requested account", async () => {
            // Arrange
            const { queries, recoveryCodeRepository } = helpers.queries();

            // Act
            await queries.getStatus({ account: ACTOR });

            // Assert
            expect(recoveryCodeRepository.getStatus.mock.calls).toEqual([[{ account: ACTOR }]]);
        });
    });
});
