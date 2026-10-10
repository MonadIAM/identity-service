import { describe, expect, it } from "@jest/globals";

import { SessionQueriesUnitHelpers } from "~testing/unit/query-services/session.helpers";

const helpers = new SessionQueriesUnitHelpers();
const ACTOR = "actor-account";
const ID = "entity-a";

describe("[Queries] - Session", () => {
    describe("[Behavior] - session lookup", () => {
        it("[case] - restricts both current session and session list to the account", async () => {
            // Arrange
            const { queries, sessionRepository } = helpers.queries();
            const session = helpers.createSession();
            sessionRepository.findUniqueOrThrow.mockResolvedValue(session);
            sessionRepository.findMany.mockResolvedValue([[session], 1]);

            // Act
            const current = await queries.getCurrent({ account: ACTOR, session: ID });
            const sessions = await queries.findMany({ account: ACTOR });

            // Assert
            expect(current).toBe(session);
            expect(sessions).toEqual([[session], 1]);
            expect(sessionRepository.findUniqueOrThrow.mock.calls).toEqual([[{ where: { id: ID, account: ACTOR } }]]);
            expect(sessionRepository.findMany.mock.calls).toEqual([[{ where: { account: ACTOR } }]]);
        });
    });
});
