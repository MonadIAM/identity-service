import { Account as AccountEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace Account {
            type Entity = AccountEntity;

            interface Contract extends Repositories.Base.Contract<Entity, Adapters.Account.Types> {
                getLookupList: (props: GetLookupList) => Promise<[Entity[], number]>;
            }

            type GetLookupList = {
                pagination: Pagination;
                term: string;
            };
        }
    }
}
