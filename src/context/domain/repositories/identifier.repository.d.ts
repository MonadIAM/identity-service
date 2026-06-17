import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Repositories {
        namespace Identifier {
            interface Contract extends Repositories.Base.Contract<Entities.Identifier, Adapters.Identifier.Types> {
                isLastVerifiedIdentifier(props: IsLastVerifiedIdentifier.Props): IsLastVerifiedIdentifier.Result;
                getLookupList(props: GetLookupList.Props): GetLookupList.Result;
            }

            namespace GetLookupList {
                type Props = {
                    pagination: Pagination;
                    account: string;
                    term: string;
                };

                type Result = Promise<[Entities.Identifier[], number]>;
            }

            namespace IsLastVerifiedIdentifier {
                type Props = {
                    transaction?: EntityManager;
                    identifier: string;
                    account: string;
                };

                type Result = Promise<boolean>;
            }
        }
    }
}
