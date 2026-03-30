import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

export const defaultBucketName = "danieloye-media";
const compatibilityDate = "2026-03-30";

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

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

export const listR2Objects = async ({
  prefix,
  bucketName = process.env.R2_BUCKET_NAME?.trim() || defaultBucketName,
}) => {
  if (!prefix) {
    throw new Error("Missing required prefix.");
  }

  if (!bucketName) {
    throw new Error("Missing bucket name. Set R2_BUCKET_NAME or pass a bucket name explicitly.");
  }

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

          return objects
            .filter((object) => typeof object.key === "string" && object.key && Number(object.size) > 0)
            .map((object) => ({
              key: object.key,
              path: toSitePath(object.key),
              size: object.size,
              uploaded: object.uploaded,
            }));
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
