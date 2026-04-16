import { EntityManager } from "@mikro-orm/postgresql";

import { Identifier as IdentifierEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace Identifier {
            type Entity = IdentifierEntity;

            interface Contract extends Repositories.Base.Contract<Entity, Adapters.Identifier.Types> {
                isLastVerifiedIdentifier: (props: IsLastVerifiedIdentifier) => Promise<boolean>;
                getLookupList: (props: GetLookupList) => Promise<[Entity[], number]>;
            }

            type GetLookupList = {
                pagination: Pagination;
                account: string;
                term: string;
            };

            type IsLastVerifiedIdentifier = {
                transaction?: EntityManager;
                identifier: string;
                account: string;
            };
        }
    }
}
