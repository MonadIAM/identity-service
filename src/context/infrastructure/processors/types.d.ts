import { Job } from "bullmq";

declare global {
    namespace Processors {
        namespace Cleanup {
            type Result = {
                nextBatch: boolean;
                deleted: number;
            };

            type Handler = (job: Job) => Promise<Result>;
        }
    }
}
