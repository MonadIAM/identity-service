#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";

const CSV_FILE = process.argv[2];
const ENV_FILE = ".env";

if (!CSV_FILE) {
    console.error("Usage: node scripts/import-aws-credentials.mjs <path-to-csv>");
    process.exit(1);
}

const csv = readFileSync(CSV_FILE, "utf8");
const line = csv.trim().split("\n").pop();
const [accessKey, secretKey] = line.split(",").map((v) => v.trim());

let env = readFileSync(ENV_FILE, "utf8");
env = env.replace(/AWS_ACCESS_KEY_ID=.*/, `AWS_ACCESS_KEY_ID="${accessKey}"`);
env = env.replace(/AWS_SECRET_ACCESS_KEY=.*/, `AWS_SECRET_ACCESS_KEY="${secretKey}"`);

writeFileSync(ENV_FILE, env);
console.log(`AWS credentials imported from ${CSV_FILE} to ${ENV_FILE}`);
