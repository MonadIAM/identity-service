#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const ENV_FILE = ".env";

const privateKey = execSync(
    "openssl ecparam -name prime256v1 -genkey -noout | openssl pkcs8 -topk8 -nocrypt",
    { encoding: "utf8" },
).trim();

const publicKey = execSync(
    "openssl ec -pubout 2>/dev/null",
    { input: privateKey, encoding: "utf8" },
).trim();

const privateLine = privateKey.replace(/\n/g, "\\n");
const publicLine = publicKey.replace(/\n/g, "\\n");

let env = readFileSync(ENV_FILE, "utf8");
env = env.replace(/JWT_PRIVATE_KEY=.*/, `JWT_PRIVATE_KEY="${privateLine}"`);
env = env.replace(/JWT_PUBLIC_KEY=.*/, `JWT_PUBLIC_KEY="${publicLine}"`);

writeFileSync(ENV_FILE, env);
console.log(`JWT keys generated and written to ${ENV_FILE}`);
