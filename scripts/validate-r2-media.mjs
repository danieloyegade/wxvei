#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { listR2Objects } from "./lib/r2-list.mjs";
import { defaultBucketName, normalizeObjectKey, toSitePath } from "./lib/r2-cli.mjs";

const usage = `Usage:
  npm run media:validate:r2 -- [--prefix <site-prefix>] [--bucket <bucket-name>] [--json]

Examples:
  npm run media:validate:r2
  npm run media:validate:r2 -- --prefix projects/tolu/
  npm run media:validate:r2 -- --prefix site/photos/ --json

Validation rules:
  - scans source files in src/ for canonical media paths
  - checks that referenced assets exist in R2
  - checks responsive JPEG variants that the site expects to resolve remotely
`;

const contentFileExtensions = new Set([".astro", ".js", ".json", ".md", ".mdx", ".mjs", ".ts", ".tsx"]);
const mediaFileExtensions = new Set([
  ".avif",
  ".eot",
  ".gif",
  ".jpeg",
  ".jpg",
  ".m4v",
  ".mov",
  ".mp4",
  ".otf",
  ".png",
  ".svg",
  ".ttf",
  ".webm",
  ".webp",
  ".woff",
  ".woff2",
]);
const responsiveImageConfigs = [
  {
    prefix: "/projects/",
    fallbackWidth: 1440,
    widths: [640, 960, 1440, 1920],
  },
  {
    prefix: "/images/",
    fallbackWidth: 1440,
    widths: [640, 960, 1440, 1920],
  },
  {
    prefix: "/blog/",
    fallbackWidth: 1440,
    widths: [640, 960, 1440, 1920],
  },
  {
    prefix: "/site/photos/",
    fallbackWidth: 960,
    widths: [480, 720, 960, 1280],
  },
];
const rootPublishedAssets = new Set([
  "/apple-touch-icon.png",
  "/favicon.svg",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/daniel-oyegade-favicon.svg",
]);
const assetPathPattern =
  /(["'`])(\/(?:projects|images|site|blog|fonts)\/[^"'`]+\.[a-z0-9]+(?:\?[^"'`]*)?|\/(?:apple-touch-icon\.png|favicon(?:-16x16|-32x32)?\.png|favicon\.svg|daniel-oyegade-favicon\.svg))\1/gi;
const sizedResponsiveSuffixPattern = /-(480|640|720|960|1280|1440|1920)\.jpe?g$/i;

const parseArgs = (argv) => {
  const options = {
    prefix: "",
    bucketName: process.env.R2_BUCKET_NAME?.trim() || defaultBucketName,
    json: false,
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

    if (arg === "--bucket") {
      options.bucketName = nextValue().trim();
      continue;
    }

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.bucketName) {
    throw new Error("Missing bucket name. Pass --bucket or set R2_BUCKET_NAME.");
  }

  return options;
};

const collectSourceFiles = async (rootPath) => {
  const entries = await readdir(rootPath, { withFileTypes: true });
  const sortedEntries = [...entries].sort((left, right) =>
    left.name.localeCompare(right.name, "en", { sensitivity: "base" })
  );
  const files = [];

  for (const entry of sortedEntries) {
    const entryPath = resolve(rootPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(entryPath)));
      continue;
    }

    if (entry.isFile() && contentFileExtensions.has(extname(entry.name).toLowerCase())) {
      files.push(entryPath);
    }
  }

  return files;
};

const stripQueryAndHash = (value) => value.replace(/[?#].*$/, "");

const isAllowedMediaPath = (assetPath) => {
  if (rootPublishedAssets.has(assetPath)) {
    return true;
  }

  return mediaFileExtensions.has(extname(stripQueryAndHash(assetPath)).toLowerCase());
};

const matchesRequestedPrefix = (assetPath, requestedPrefix) => {
  if (!requestedPrefix) {
    return true;
  }

  const normalizedPath = normalizeObjectKey(assetPath);

  if (normalizedPath === requestedPrefix) {
    return true;
  }

  const folderPrefix = requestedPrefix.endsWith("/") ? requestedPrefix : `${requestedPrefix}/`;
  return normalizedPath.startsWith(folderPrefix);
};

const buildResponsiveVariantPath = (assetPath, width) =>
  assetPath.replace(/\.(jpe?g)$/i, `-${width}.jpg`);

const getResponsiveVariants = (assetPath) => {
  if (!/\.(jpe?g)$/i.test(assetPath) || sizedResponsiveSuffixPattern.test(assetPath)) {
    return [];
  }

  const config = responsiveImageConfigs.find((candidate) => assetPath.startsWith(candidate.prefix));

  if (!config) {
    return [];
  }

  return [
    buildResponsiveVariantPath(assetPath, config.fallbackWidth),
    ...config.widths.map((width) => buildResponsiveVariantPath(assetPath, width)),
  ];
};

const ensureRequiredAsset = (requiredAssets, assetPath, details) => {
  const existing = requiredAssets.get(assetPath) ?? {
    generatedFrom: new Set(),
    referencedBy: new Set(),
  };

  if (details.generatedFrom) {
    existing.generatedFrom.add(details.generatedFrom);
  }

  if (details.referencedBy) {
    existing.referencedBy.add(details.referencedBy);
  }

  requiredAssets.set(assetPath, existing);
};

const getLookupPrefix = (assetPath, requestedPrefix) => {
  const normalizedPath = normalizeObjectKey(assetPath);

  if (requestedPrefix && matchesRequestedPrefix(assetPath, requestedPrefix)) {
    return requestedPrefix;
  }

  if (normalizedPath.startsWith("projects/")) {
    return "projects/";
  }

  if (normalizedPath.startsWith("images/")) {
    return "images/";
  }

  if (normalizedPath.startsWith("site/")) {
    return "site/";
  }

  if (normalizedPath.startsWith("blog/")) {
    return "blog/";
  }

  if (normalizedPath.startsWith("fonts/")) {
    return "fonts/";
  }

  return normalizedPath;
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const requestedPrefix = normalizeObjectKey(options.prefix);
  const sourceFiles = await collectSourceFiles(resolve(process.cwd(), "src"));
  const directAssets = new Map();

  for (const filePath of sourceFiles) {
    const contents = await readFile(filePath, "utf8");
    let match;

    while ((match = assetPathPattern.exec(contents)) !== null) {
      const assetPath = stripQueryAndHash(match[2]);

      if (!isAllowedMediaPath(assetPath) || !matchesRequestedPrefix(assetPath, requestedPrefix)) {
        continue;
      }

      const referencedBy = filePath.replace(`${process.cwd()}/`, "");
      const existing = directAssets.get(assetPath) ?? new Set();
      existing.add(referencedBy);
      directAssets.set(assetPath, existing);
    }
  }

  if (directAssets.size === 0) {
    const message = requestedPrefix
      ? `No canonical asset paths in src/ matched "${toSitePath(requestedPrefix)}".`
      : "No canonical asset paths were found in src/.";

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            ok: true,
            bucketName: options.bucketName,
            requestedPrefix: requestedPrefix ? toSitePath(requestedPrefix) : null,
            directReferenceCount: 0,
            requiredAssetCount: 0,
            lookupPrefixes: [],
            missing: [],
            message,
          },
          null,
          2
        )
      );
      return;
    }

    console.log(message);
    return;
  }

  const requiredAssets = new Map();

  for (const [assetPath, referencedBySet] of directAssets) {
    for (const referencedBy of referencedBySet) {
      ensureRequiredAsset(requiredAssets, assetPath, { referencedBy });
    }

    for (const responsiveVariant of getResponsiveVariants(assetPath)) {
      for (const referencedBy of referencedBySet) {
        ensureRequiredAsset(requiredAssets, responsiveVariant, {
          referencedBy,
          generatedFrom: assetPath,
        });
      }
    }
  }

  const lookupPrefixes = [...new Set(
    [...requiredAssets.keys()].map((assetPath) => getLookupPrefix(assetPath, requestedPrefix))
  )].sort((left, right) => left.localeCompare(right, "en", { sensitivity: "base" }));
  const remotePaths = new Set();
  let checkedObjectCount = 0;

  for (const prefix of lookupPrefixes) {
    const objects = await listR2Objects({
      prefix,
      bucketName: options.bucketName,
    });

    checkedObjectCount += objects.length;

    for (const object of objects) {
      remotePaths.add(object.path);
    }
  }

  const missing = [...requiredAssets.entries()]
    .filter(([assetPath]) => !remotePaths.has(assetPath))
    .map(([assetPath, details]) => ({
      path: assetPath,
      generatedFrom: [...details.generatedFrom].sort((left, right) =>
        left.localeCompare(right, "en", { sensitivity: "base" })
      ),
      referencedBy: [...details.referencedBy].sort((left, right) =>
        left.localeCompare(right, "en", { sensitivity: "base" })
      ),
    }))
    .sort((left, right) => left.path.localeCompare(right.path, "en", { sensitivity: "base" }));

  const summary = {
    ok: missing.length === 0,
    bucketName: options.bucketName,
    requestedPrefix: requestedPrefix ? toSitePath(requestedPrefix) : null,
    directReferenceCount: directAssets.size,
    requiredAssetCount: requiredAssets.size,
    lookupPrefixes: lookupPrefixes.map((prefix) => toSitePath(prefix)),
    checkedObjectCount,
    missing,
  };

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else if (missing.length === 0) {
    console.log(
      `Validated ${requiredAssets.size} asset path${requiredAssets.size === 1 ? "" : "s"} in R2.`
    );
    console.log(`Checked ${checkedObjectCount} remote object${checkedObjectCount === 1 ? "" : "s"}.`);
  } else {
    console.error(
      `Missing ${missing.length} asset path${missing.length === 1 ? "" : "s"} in R2 (${requiredAssets.size} required).`
    );

    for (const item of missing) {
      const context = item.generatedFrom[0]
        ? `responsive variant of ${item.generatedFrom[0]}`
        : `referenced by ${item.referencedBy[0] ?? "an unknown source file"}`;
      console.error(`- ${item.path} (${context})`);
    }
  }

  if (missing.length > 0) {
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
