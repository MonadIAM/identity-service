declare namespace Fixtures {
    namespace Identifier {
        interface Contract extends Fixtures.Core.Contract {
            orderedLookupScenario: OrderedLookupScenario.Signature;
            profileLookupScenario: ProfileLookupScenario.Signature;
            verificationScenario: VerificationScenario.Signature;
            lookupSearchScenario: LookupSearchScenario.Signature;
            lookupScenario: LookupScenario.Signature;
        }

        namespace LookupScenario {
            type Result = Promise<{
                otherAccount: Entities.Identifier;
                matched: Entities.Identifier;
                account: Entities.Account;
            }>;

            type Signature = () => Result;
        }

        namespace ProfileLookupScenario {
            type Result = Promise<{
                otherAccount: Entities.Identifier;
                matched: Entities.Identifier;
                account: Entities.Account;
            }>;

            type Signature = () => Result;
        }

        namespace LookupSearchScenario {
            type Result = Promise<{
                expectedOrderedIDs: string[];
                account: Entities.Account;
                term: string;
            }>;

            type Signature = () => Result;
        }

        namespace OrderedLookupScenario {
            type Result = Promise<{
                otherAccount: Entities.Identifier;
                charlie: Entities.Identifier;
                alpha: Entities.Identifier;
                bravo: Entities.Identifier;
                account: Entities.Account;
            }>;

            type Signature = () => Result;
        }

        namespace VerificationScenario {
            type Result = Promise<{
                unverified: Entities.Identifier;
                soloAccount: Entities.Account;
                second: Entities.Identifier;
                first: Entities.Identifier;
                account: Entities.Account;
                solo: Entities.Identifier;
            }>;

            type Signature = () => Result;
        }
    }
}
