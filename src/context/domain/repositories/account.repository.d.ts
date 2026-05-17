declare namespace Repositories {
    namespace Account {
        interface Contract extends Repositories.Base.Contract<Entities.Account, Adapters.Account.Types> {
            getLookupList: (props: GetLookupList.Props) => GetLookupList.Result;
        }

        namespace GetLookupList {
            type Props = {
                pagination: Pagination;
                term: string;
            };

            type Result = Promise<[Entities.Account[], number]>;
        }
    }
}
