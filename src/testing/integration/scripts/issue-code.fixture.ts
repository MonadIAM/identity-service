import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import Redis from "ioredis";

export class IssueCodeFixture {
    public readonly requestKey = "authorization:request:test";
    public readonly codeKey = "authorization:code:test";
    private hash = "";

    public constructor(private readonly redis: Redis) {}

    public async load(): Promise<void> {
        const source = await readFile(resolve("src/context/infrastructure/scripts/issue-code.lua"), "utf8");
        const hash = await this.redis.script("LOAD", source);
        if (typeof hash !== "string") {
            throw new Error("Invalid Redis script hash");
        }
        this.hash = hash;
    }

    public async issue(props: Scripts.IssueCode.Props, key = this.codeKey): Promise<Scripts.IssueCode.Result> {
        const result = await this.redis.evalsha(this.hash, 2, this.requestKey, key, JSON.stringify(props));
        if (typeof result !== "string") {
            throw new Error("Invalid issue-code result");
        }
        return JSON.parse(result);
    }

    public async code(): Promise<Nullable<InfrastructureServices.AuthorizationCache.CodeMetadata>> {
        const encoded = await this.redis.get(this.codeKey);
        return encoded ? JSON.parse(encoded) : null;
    }
}
