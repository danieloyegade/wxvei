import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { basename, extname, resolve } from "node:path";

export const defaultBucketName = "danieloye-media";
export const defaultCacheControl = "public, max-age=31536000, immutable";
export const defaultMaxWranglerUploadBytes = 314572800;

const localWranglerCliPath = resolve(process.cwd(), "node_modules/wrangler/bin/wrangler.js");
const defaultWranglerExecutable = existsSync(localWranglerCliPath) ? process.execPath : "npx";
const defaultWranglerArgs = existsSync(localWranglerCliPath)
  ? [localWranglerCliPath]
  : ["wrangler@latest"];

const contentTypeByExtension = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".avif", "image/avif"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".ttf", "font/ttf"],
  [".otf", "font/otf"],
  [".eot", "application/vnd.ms-fontobject"],
  [".mp4", "video/mp4"],
  [".mov", "video/quicktime"],
  [".m4v", "video/x-m4v"],
  [".webm", "video/webm"],
]);

export const normalizeObjectKey = (value = "") =>
  value.replace(/\\/g, "/").replace(/^\.\/+/, "").replace(/^\/+/, "").replace(/\/{2,}/g, "/");

export const normalizePrefix = (value = "") => {
  const normalized = normalizeObjectKey(value.trim());

  if (!normalized) {
    return "";
  }

  return normalized.endsWith("/") ? normalized : `${normalized}/`;
};

export const toSitePath = (key) => `/${normalizeObjectKey(key)}`;

export const getContentTypeForPath = (filePath) =>
  contentTypeByExtension.get(extname(filePath).toLowerCase());

export const basenameFromObjectKey = (key) => basename(normalizeObjectKey(key));

export const stripPrefixFromObjectKey = (objectKey, prefix = "") => {
  const normalizedKey = normalizeObjectKey(objectKey);
  const normalizedPrefix = normalizeObjectKey(prefix);

  if (!normalizedPrefix) {
    return normalizedKey;
  }

  if (normalizedKey === normalizedPrefix) {
    return basenameFromObjectKey(normalizedKey);
  }

  const folderPrefix = normalizedPrefix.endsWith("/") ? normalizedPrefix : `${normalizedPrefix}/`;

  if (normalizedKey.startsWith(folderPrefix)) {
    return normalizedKey.slice(folderPrefix.length);
  }

  return normalizedKey;
};

export const resolveWranglerCommand = () => {
  const override = process.env.WRANGLER_CMD?.trim();

  if (override) {
    return {
      executable: override,
      args: [],
    };
  }

  return {
    executable: defaultWranglerExecutable,
    args: defaultWranglerArgs,
  };
};

export const runWrangler = ({ args, cwd = process.cwd(), env = {}, stdio = "inherit" }) =>
  new Promise((resolvePromise, reject) => {
    const { executable, args: baseArgs } = resolveWranglerCommand();
    const child = spawn(executable, [...baseArgs, ...args], {
      cwd,
      env: {
        ...process.env,
        ...env,
        CI: process.env.CI ?? "1",
      },
      stdio,
    });

    child.on("error", reject);
    child.on("close", (code, signal) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      if (signal) {
        reject(new Error(`Wrangler exited with signal ${signal}.`));
        return;
      }

      reject(new Error(`Wrangler exited with code ${code ?? "unknown"}.`));
    });
  });
