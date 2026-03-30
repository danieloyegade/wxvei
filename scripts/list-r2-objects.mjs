#!/usr/bin/env node

import { defaultBucketName, listR2Objects } from "./lib/r2-list.mjs";
const usage = `Usage:
  npm run r2:list -- <prefix> [--json] [--bucket <bucket-name>]

Examples:
  npm run r2:list -- projects/tolu/photos/
  npm run r2:list -- projects/tolu/photos/ --json

Environment:
  R2_BUCKET_NAME       Override the default bucket name (${defaultBucketName})
  WRANGLER_CMD         Override the Wrangler executable used to start the temporary worker
`;

const parseArgs = (argv) => {
  const options = {
    prefix: "",
    json: false,
    bucketName: process.env.R2_BUCKET_NAME?.trim() || defaultBucketName,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--bucket") {
      options.bucketName = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.log(usage);
      process.exit(0);
    }

    if (!options.prefix) {
      options.prefix = arg;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.prefix) {
    throw new Error("Missing required prefix argument.");
  }

  if (!options.bucketName) {
    throw new Error("Missing bucket name. Pass --bucket or set R2_BUCKET_NAME.");
  }

  return options;
};

const main = async () => {
  const { prefix, json, bucketName } = parseArgs(process.argv.slice(2));
  const objects = await listR2Objects({ prefix, bucketName });

  if (json) {
    console.log(JSON.stringify(objects, null, 2));
  } else {
    console.log(objects.map((object) => object.path).join("\n"));
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
