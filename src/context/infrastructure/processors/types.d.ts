declare namespace Processors {
    namespace Cleanup {
        type Result = {
            nextBatch: boolean;
            deleted: number;
        };
    }
}
