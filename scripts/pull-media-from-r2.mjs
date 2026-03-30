#!/usr/bin/env node

import { mkdir, stat } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { listR2Objects } from "./lib/r2-list.mjs";
import {
  defaultBucketName,
  normalizeObjectKey,
  runWrangler,
  stripPrefixFromObjectKey,
} from "./lib/r2-cli.mjs";

const usage = `Usage:
  npm run media:pull:r2 -- --prefix <r2-prefix> [--dest <directory>] [--bucket <bucket-name>] [--dry-run]

Examples:
  npm run media:pull:r2 -- --prefix projects/tolu/photos/
  npm run media:pull:r2 -- --prefix projects/tolu/photos/ --dest ./media/work/tolu
  npm run media:pull:r2 -- --prefix projects/tolu/photos/cover.jpg --dest ./tmp

Options:
  --prefix <value>     R2 prefix or exact object key to download
  --dest <path>        Local destination root (defaults to ./.media-cache/<prefix>)
  --bucket <value>     Bucket name (defaults to ${defaultBucketName})
  --force              Download even when a same-size local file already exists
  --dry-run            Print the downloads without writing files
`;

const parseArgs = (argv) => {
  const options = {
    prefix: "",
    dest: "",
    bucketName: process.env.R2_BUCKET_NAME?.trim() || defaultBucketName,
    dryRun: false,
    force: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const nextValue = () => {
      const value = argv[index + 1] ?? "";
      index += 1;
      return value;
    };

    if (arg === "--help" || arg === "-h") {
      console.log(usage);
      process.exit(0);
    }

    if (arg === "--prefix") {
      options.prefix = nextValue();
      continue;
    }

    if (arg === "--dest") {
      options.dest = nextValue();
      continue;
    }

    if (arg === "--bucket") {
      options.bucketName = nextValue().trim();
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--force") {
      options.force = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.prefix) {
    throw new Error("Missing required --prefix argument.");
  }

  if (!options.bucketName) {
    throw new Error("Missing bucket name. Pass --bucket or set R2_BUCKET_NAME.");
  }

  return options;
};

const looksLikeFileKey = (value) => Boolean(extname(value));

const getDefaultDestination = (prefix) => {
  const normalizedPrefix = normalizeObjectKey(prefix).replace(/\/+$/, "");

  if (!normalizedPrefix) {
    return resolve(process.cwd(), ".media-cache");
  }

  const directoryRoot = looksLikeFileKey(normalizedPrefix)
    ? dirname(normalizedPrefix)
    : normalizedPrefix;

  return resolve(process.cwd(), join(".media-cache", directoryRoot));
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const objects = await listR2Objects({
    prefix: options.prefix,
    bucketName: options.bucketName,
  });

  if (objects.length === 0) {
    throw new Error(`No objects were found under the R2 prefix "${options.prefix}".`);
  }

  const destinationRoot = options.dest
    ? resolve(process.cwd(), options.dest)
    : getDefaultDestination(options.prefix);

  let downloadedCount = 0;
  let skippedCount = 0;

  for (const object of objects) {
    const relativePath = stripPrefixFromObjectKey(object.key, options.prefix);
    const targetPath = resolve(destinationRoot, relativePath);
    const existingFile = await stat(targetPath).catch(() => null);

    if (!options.force && existingFile?.isFile() && existingFile.size === Number(object.size)) {
      console.log(`Skipping ${targetPath}; already matches remote size.`);
      skippedCount += 1;
      continue;
    }

    if (options.dryRun) {
      console.log(`[dry-run] ${options.bucketName}/${object.key} -> ${targetPath}`);
      downloadedCount += 1;
      continue;
    }

    await mkdir(dirname(targetPath), { recursive: true });
    console.log(`Downloading ${options.bucketName}/${object.key} -> ${targetPath}`);
    await runWrangler({
      args: [
        "r2",
        "object",
        "get",
        `${options.bucketName}/${object.key}`,
        "--file",
        targetPath,
        "--remote",
      ],
    });
    downloadedCount += 1;
  }

  console.log(
    `${options.dryRun ? "Prepared" : "Downloaded"} ${downloadedCount} object${
      downloadedCount === 1 ? "" : "s"
    }${skippedCount > 0 ? ` and skipped ${skippedCount}` : ""}.`
  );
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
