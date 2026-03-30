#!/usr/bin/env node

import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createServer } from "node:net";
import { spawn } from "node:child_process";

const defaultBucketName = "danieloye-media";
const compatibilityDate = "2026-03-30";
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

const getAvailablePort = async () =>
  new Promise((resolvePort, reject) => {
    const server = createServer();

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Could not determine an available local port.")));
        return;
      }

      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolvePort(address.port);
      });
    });

    server.on("error", reject);
  });

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

const normalizedPrefix = (prefix) => prefix.replace(/^\/+/, "");

const toSitePath = (key) => `/${key.replace(/^\/+/, "")}`;

const localWranglerCliPath = resolve(process.cwd(), "node_modules/wrangler/bin/wrangler.js");
const defaultWranglerExecutable = existsSync(localWranglerCliPath) ? process.execPath : "npx";
const defaultWranglerArgs = existsSync(localWranglerCliPath)
  ? [localWranglerCliPath]
  : ["wrangler@latest"];

const buildWorkerSource = () => `export default {
  async fetch(request, env) {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get("prefix") ?? "";
    const cursor = searchParams.get("cursor") ?? undefined;

    const result = await env.MEDIA.list({
      prefix,
      cursor,
      limit: 1000,
    });

    return Response.json({
      objects: result.objects.map((object) => ({
        key: object.key,
        size: object.size,
        uploaded: object.uploaded,
      })),
      truncated: result.truncated,
      cursor: result.cursor ?? null,
      delimitedPrefixes: result.delimitedPrefixes ?? [],
    });
  },
};`;

const buildWranglerConfig = (bucketName) => `name = "wxveri2-r2-list"
main = "worker.mjs"
compatibility_date = "${compatibilityDate}"

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "${bucketName}"
remote = true
`;

const main = async () => {
  const { prefix, json, bucketName } = parseArgs(process.argv.slice(2));
  const tempDir = await mkdtemp(join(tmpdir(), "wxveri2-r2-list-"));
  const workerPath = join(tempDir, "worker.mjs");
  const configPath = join(tempDir, "wrangler.toml");
  const port = await getAvailablePort();
  const requestUrl = `http://127.0.0.1:${port}/?prefix=${encodeURIComponent(normalizedPrefix(prefix))}`;
  const wranglerExecutable = process.env.WRANGLER_CMD?.trim() || defaultWranglerExecutable;
  const wranglerArgs = process.env.WRANGLER_CMD?.trim() ? [] : defaultWranglerArgs;

  await writeFile(workerPath, buildWorkerSource(), "utf8");
  await writeFile(configPath, buildWranglerConfig(bucketName), "utf8");

  let child;
  let stderr = "";

  try {
    child = spawn(
      wranglerExecutable,
      [
        ...wranglerArgs,
        "dev",
        "--config",
        configPath,
        "--port",
        String(port),
        "--ip",
        "127.0.0.1",
        "--inspector-ip",
        "127.0.0.1",
        "--log-level",
        "error",
      ],
      {
        cwd: tempDir,
        env: {
          ...process.env,
          CI: "1",
        },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.stdout?.on("data", () => {});

    const timeoutAt = Date.now() + 30000;

    while (Date.now() < timeoutAt) {
      if (child.exitCode !== null) {
        throw new Error(stderr.trim() || `Wrangler exited early with code ${child.exitCode}.`);
      }

      try {
        const response = await fetch(requestUrl);

        if (response.ok) {
          const payload = await response.json();
          const objects = Array.isArray(payload.objects) ? payload.objects : [];
          const normalizedObjects = objects
            .filter((object) => typeof object.key === "string" && object.key && Number(object.size) > 0)
            .map((object) => ({
              key: object.key,
              path: toSitePath(object.key),
              size: object.size,
              uploaded: object.uploaded,
            }));

          if (json) {
            console.log(JSON.stringify(normalizedObjects, null, 2));
          } else {
            console.log(normalizedObjects.map((object) => object.path).join("\n"));
          }

          return;
        }
      } catch {
        // Keep polling until Wrangler is ready or times out.
      }

      await sleep(500);
    }

    throw new Error("Timed out waiting for Wrangler to expose the temporary R2 listing worker.");
  } finally {
    if (child && child.exitCode === null) {
      child.kill("SIGINT");
      await sleep(250);

      if (child.exitCode === null) {
        child.kill("SIGTERM");
      }
    }

    await rm(tempDir, { recursive: true, force: true });
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
