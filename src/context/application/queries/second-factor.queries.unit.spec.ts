import { describe, expect, it } from "@jest/globals";

import { SecondFactorQueriesUnitHelpers } from "~testing/unit/query-services/second-factor.helpers";

const helpers = new SecondFactorQueriesUnitHelpers();
const ACTOR = "actor-account";
const ID = "entity-a";

describe("SecondFactorQueries", () => {
    describe("getQRCode", () => {
        it.each([false, true])("returns the QR secret and rotates ciphertext only when needed: %s", async (rotate) => {
            const { queries, transaction, secondFactorRepository, secondFactorSecretService, totpService } =
                await helpers.queries();
            const factor = helpers.createSecondFactor({ id: ID, secret: "old-ciphertext", confirmedAt: undefined });
            secondFactorRepository.findUnique.mockResolvedValue(factor);
            secondFactorSecretService.resolve.mockResolvedValue({
                plaintext: "plain-secret",
                ciphertext: rotate ? "new-ciphertext" : undefined,
            });
            totpService.createURI.mockReturnValue("otpauth://unit");

            const result = await queries.getQRCode({ actor: ACTOR, id: ID });

            expect(secondFactorRepository.findUnique.mock.calls).toEqual([
                [{ where: { account: ACTOR, id: ID }, transaction: transaction.entityManager }],
            ]);
            expect(secondFactorSecretService.resolve.mock.calls).toEqual([[{ secret: "old-ciphertext" }]]);
            expect(totpService.createURI.mock.calls).toEqual([[{ label: ACTOR, secret: "plain-secret" }]]);
            expect(factor.secret).toBe(rotate ? "new-ciphertext" : "old-ciphertext");
            expect(result).toEqual({ id: ID, uri: "otpauth://unit" });
        });

        it.each(["missing", "confirmed"])("does not disclose a QR code for a %s factor", async (state) => {
            const { queries, secondFactorRepository, secondFactorSecretService, totpService } = await helpers.queries();
            secondFactorRepository.findUnique.mockResolvedValue(
                state === "missing" ? null : helpers.createSecondFactor({ confirmedAt: new Date() }),
            );

            await expect(queries.getQRCode({ actor: ACTOR, id: ID })).rejects.toThrow();

            expect(secondFactorSecretService.resolve).not.toHaveBeenCalled();
            expect(totpService.createURI).not.toHaveBeenCalled();
        });
    });

    describe("findMany", () => {
        it("lists only the account's factors", async () => {
            const { queries, secondFactorRepository } = await helpers.queries();

            await queries.findMany({ account: ACTOR });

            expect(secondFactorRepository.findMany.mock.calls).toEqual([[{ where: { account: ACTOR } }]]);
        });
    });
});
