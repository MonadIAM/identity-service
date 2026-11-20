import { hashSync, verifySync } from "@node-rs/argon2";

import { Exception } from "../exceptions/exception";

export default function execute(request: CommonServices.Hashing.Worker.Request): CommonServices.Hashing.Worker.Response {
    let result: CommonServices.Hashing.Worker.Result;

    if (request.operation === "hash") {
        const { options, value } = request;
        if (options.version !== 16 && options.version !== 19) {
            throw Exception.internal({ messageKey: "services.hashing.UNSUPPORTED_ARGON2_VERSION" });
        }
        result = {
            operation: "hash",
            value: hashSync(value, {
                version: options.version === 16 ? 0 : 1,
                parallelism: options.parallelism,
                memoryCost: options.memoryCost,
                outputLen: options.hashLength,
                timeCost: options.timeCost,
                algorithm: options.type,
            }),
        };
    } else {
        let valid = false;
        try {
            valid = verifySync(request.storedHash, request.value);
        } catch {
            valid = false;
        }
        result = { operation: "verify", value: valid };
    }

    return { result };
}
