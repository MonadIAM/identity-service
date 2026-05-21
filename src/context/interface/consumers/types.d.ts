declare namespace Consumers {
    namespace AccessCacheInvalidation {
        interface Contract {
            handle: (props: Handle.Props) => Handle.Result;
        }

        namespace Handle {
            type Props = Events.AccessCache.Invalidation;
            type Result = Promise<void>;
        }
    }
}
