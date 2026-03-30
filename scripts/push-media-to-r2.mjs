#!/usr/bin/env node

import { readdir, stat } from "node:fs/promises";
import { basename, relative, resolve } from "node:path";
import {
  defaultBucketName,
  defaultCacheControl,
  defaultMaxWranglerUploadBytes,
  getContentTypeForPath,
  normalizeObjectKey,
  normalizePrefix,
  runWrangler,
} from "./lib/r2-cli.mjs";

const usage = `Usage:
  npm run media:push:r2 -- --source <path> [--prefix <r2-prefix>] [--bucket <bucket-name>] [--dry-run]

Examples:
  npm run media:push:r2 -- --source ~/Exports/Tolu --prefix projects/tolu/photos/
  npm run media:push:r2 -- --source ./public --bucket danieloye-media
  npm run media:push:r2 -- --source ./cover.jpg --prefix projects/example/photos/cover.jpg

Options:
  --source, --src <path>        Local file or directory to upload
  --prefix <value>              R2 prefix for directories, or exact object key for a single file
  --bucket <value>              Bucket name (defaults to ${defaultBucketName})
  --cache-control <value>       Cache-Control header (defaults to ${defaultCacheControl})
  --max-upload-bytes <number>   Per-object Wrangler upload limit (defaults to ${defaultMaxWranglerUploadBytes})
  --dry-run                     Print the uploads without sending files
`;

const collectFiles = async (rootPath) => {
  const entries = await readdir(rootPath, { withFileTypes: true });
  const sortedEntries = [...entries].sort((left, right) =>
    left.name.localeCompare(right.name, "en", { sensitivity: "base" })
  );
  const files = [];

  for (const entry of sortedEntries) {
    const entryPath = resolve(rootPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(entryPath)));
      continue;
    }

    if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
};

const parseNumber = (value, flagName) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flagName} must be a positive number.`);
  }

  return Math.floor(parsed);
};

const parseArgs = (argv) => {
  const options = {
    source: "",
    prefix: "",
    bucketName: process.env.R2_BUCKET_NAME?.trim() || defaultBucketName,
    cacheControl: process.env.R2_CACHE_CONTROL ?? defaultCacheControl,
    maxUploadBytes: parseNumber(
      process.env.R2_MAX_WRANGLER_UPLOAD_BYTES ?? String(defaultMaxWranglerUploadBytes),
      "R2_MAX_WRANGLER_UPLOAD_BYTES"
    ),
    dryRun: false,
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

    if (arg === "--source" || arg === "--src") {
      options.source = nextValue();
      continue;
    }

    if (arg === "--prefix") {
      options.prefix = nextValue();
      continue;
    }

    if (arg === "--bucket") {
      options.bucketName = nextValue().trim();
      continue;
    }

    if (arg === "--cache-control") {
      options.cacheControl = nextValue();
      continue;
    }

    if (arg === "--max-upload-bytes") {
      options.maxUploadBytes = parseNumber(nextValue(), "--max-upload-bytes");
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.source) {
    throw new Error("Missing required --source argument.");
  }

  if (!options.bucketName) {
    throw new Error("Missing bucket name. Pass --bucket or set R2_BUCKET_NAME.");
  }

  return options;
};

const buildObjectKey = ({ sourcePath, filePath, prefix, sourceIsDirectory }) => {
  if (!sourceIsDirectory) {
    const normalizedPrefix = normalizeObjectKey(prefix);

    if (!normalizedPrefix) {
      return basename(filePath);
    }

    if (prefix.trim().endsWith("/")) {
      return normalizeObjectKey(`${normalizePrefix(prefix)}${basename(filePath)}`);
    }

    return normalizedPrefix;
  }

  const relativePath = normalizeObjectKey(relative(sourcePath, filePath));
  return normalizeObjectKey(`${normalizePrefix(prefix)}${relativePath}`);
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const sourcePath = resolve(process.cwd(), options.source);
  const sourceStats = await stat(sourcePath).catch(() => null);

  if (!sourceStats) {
    throw new Error(`Source path not found: ${sourcePath}`);
  }

  if (!sourceStats.isFile() && !sourceStats.isDirectory()) {
    throw new Error(`Source must be a file or directory: ${sourcePath}`);
  }

  const sourceIsDirectory = sourceStats.isDirectory();
  const files = sourceIsDirectory ? await collectFiles(sourcePath) : [sourcePath];

  if (files.length === 0) {
    throw new Error(`No files found to upload from ${sourcePath}.`);
  }

  const uploads = [];

  for (const filePath of files) {
    const fileStats = await stat(filePath);
    uploads.push({
      filePath,
      size: fileStats.size,
      objectKey: buildObjectKey({
        sourcePath,
        filePath,
        prefix: options.prefix,
        sourceIsDirectory,
      }),
    });
  }

  const oversizeUploads = uploads.filter((upload) => upload.size > options.maxUploadBytes);
  const validUploads = uploads.filter((upload) => upload.size <= options.maxUploadBytes);

  if (validUploads.length === 0) {
    throw new Error("No uploads are within Wrangler's per-object upload limit.");
  }

  for (const upload of validUploads) {
    const wranglerArgs = [
      "r2",
      "object",
      "put",
      `${options.bucketName}/${upload.objectKey}`,
      "--file",
      upload.filePath,
      "--remote",
      "--cache-control",
      options.cacheControl,
    ];
    const contentType = getContentTypeForPath(upload.filePath);

    if (contentType) {
      wranglerArgs.push("--content-type", contentType);
    }

    if (options.dryRun) {
      console.log(`[dry-run] ${upload.filePath} -> ${options.bucketName}/${upload.objectKey}`);
      continue;
    }

    console.log(`Uploading ${upload.filePath} -> ${options.bucketName}/${upload.objectKey}`);
    await runWrangler({ args: wranglerArgs });
  }

  if (oversizeUploads.length > 0) {
    for (const upload of oversizeUploads) {
      console.error(
        `Skipped ${upload.filePath} (${upload.size} bytes); exceeds Wrangler upload limit of ${options.maxUploadBytes} bytes.`
      );
    }
  }

  console.log(
    `${options.dryRun ? "Prepared" : "Uploaded"} ${validUploads.length} object${validUploads.length === 1 ? "" : "s"}.`
  );

  if (oversizeUploads.length > 0) {
    throw new Error(
      `Skipped ${oversizeUploads.length} oversized file${oversizeUploads.length === 1 ? "" : "s"}.`
    );
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
