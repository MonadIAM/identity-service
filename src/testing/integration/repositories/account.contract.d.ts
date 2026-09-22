declare namespace Fixtures.Account {
    interface Contract extends Fixtures.Core.Contract {
        expirationBoundaryScenario: ExpirationBoundaryScenario.Signature;
        displayNameLookupScenario: DisplayNameLookupScenario.Signature;
        activityWatermarkScenario: ActivityWatermarkScenario.Signature;
        profilelessLookupScenario: ProfilelessLookupScenario.Signature;
        orderedLookupScenario: OrderedLookupScenario.Signature;
        lookupSearchScenario: LookupSearchScenario.Signature;
        expirationScenario: ExpirationScenario.Signature;
        cascadeScenario: CascadeScenario.Signature;
        lookupScenario: LookupScenario.Signature;
    }

    namespace LookupScenario {
        type Result = Promise<{
            matched: Entities.Account;
            other: Entities.Account;
        }>;

        type Signature = () => Result;
    }

    namespace DisplayNameLookupScenario {
        type Result = Promise<{
            matched: Entities.Account;
            other: Entities.Account;
        }>;

        type Signature = () => Result;
    }

    namespace LookupSearchScenario {
        type Result = Promise<{
            expectedOrderedIDs: string[];
            term: string;
        }>;

        type Signature = () => Result;
    }

    namespace OrderedLookupScenario {
        type Result = Promise<{
            charlie: Entities.Account;
            alpha: Entities.Account;
            bravo: Entities.Account;
        }>;

        type Signature = () => Result;
    }

    namespace ExpirationScenario {
        type Result = Promise<{
            recentPending: Entities.Account;
            touchedActive: Entities.Account;
            updatedActive: Entities.Account;
            recentActive: Entities.Account;
            oldPending: Entities.Account;
            oldActive: Entities.Account;
        }>;

        type Signature = () => Result;
    }

    namespace ExpirationBoundaryScenario {
        type Result = Promise<{
            boundaryPending: Entities.Account;
            boundaryActive: Entities.Account;
            expiredPending: Entities.Account;
            expiredActive: Entities.Account;
            expirationDate: Date;
        }>;

        type Signature = () => Result;
    }

    namespace ActivityWatermarkScenario {
        type Result = Promise<{
            activeByActivity: Entities.Account;
            staleByActivity: Entities.Account;
        }>;

        type Signature = () => Result;
    }

    namespace ProfilelessLookupScenario {
        type Result = Promise<{
            anonymous: Entities.Account;
            named: Entities.Account;
        }>;

        type Signature = () => Result;
    }

    namespace CascadeScenario {
        type Result = Promise<{
            removed: Entities.Account;
            kept: Entities.Account;
        }>;

        type Signature = () => Result;
    }
}
