#!/usr/bin/env node

import { existsSync } from "node:fs";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { spawn } from "node:child_process";
import process from "node:process";

const workspaceRoot = process.cwd();
const projectContentDir = resolve(workspaceRoot, "src/content/projects");
const postContentDir = resolve(workspaceRoot, "src/content/posts");
const sectionDataFile = resolve(workspaceRoot, "src/data/projectSections.ts");
const cacheControl = process.env.R2_CACHE_CONTROL ?? "public, max-age=31536000, immutable";
const bucketName = process.env.R2_BUCKET_NAME?.trim();
const wranglerCmd = process.env.WRANGLER_CMD?.trim() || "npx wrangler@latest";
const coverWidths = [640, 960, 1440, 1920];
const sectionToExportName = {
  "mixed-media": "mixedMediaProjectSlugs",
  portraiture: "portraitureProjectSlugs",
  "short-films": "shortFilmProjectSlugs",
};
const supportedProjectSections = new Set([
  "selected-work",
  "mixed-media",
  "portraiture",
  "short-films",
]);
const layoutPatterns = new Set([
  "lead-left",
  "support-right",
  "wide-band",
  "support-left",
  "lead-right",
  "paired-left",
  "paired-right",
  "hero-left",
  "tail-right",
  "offset-right",
]);
const visualWeights = new Set(["support", "standard", "dominant", "hero"]);
const orientations = new Set(["portrait", "landscape", "wide"]);
const cropFocusValues = new Set(["center", "top", "upper-third"]);
const imageExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".gif",
  ".heic",
  ".heif",
  ".tif",
  ".tiff",
]);
const videoExtensions = new Set([".mp4", ".mov", ".m4v", ".webm"]);

const usage = `Usage:
  node ./scripts/publish-content.mjs --manifest ./path/to/manifest.json [--dry-run] [--skip-upload]

Required environment for uploads:
  R2_BUCKET_NAME=<bucket-name>

Manifest types:
  - project
  - blog-post`;

const commandAvailability = new Map();

const yamlString = (value) => JSON.stringify(value);

const formatYamlStringList = (key, values) => {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }

  return [(`${key}:`), ...values.map((value) => `  - ${yamlString(value)}`)];
};

const formatYamlObjectList = (key, values) => {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }

  return [
    `${key}:`,
    ...values.flatMap((item) => [
      "  -",
      ...Object.entries(item).map(([entryKey, entryValue]) => `    ${entryKey}: ${yamlString(entryValue)}`),
    ]),
  ];
};

const formatYamlVideo = (key, video) => {
  if (!video) {
    return [];
  }

  const lines = [`${key}:`];

  for (const [entryKey, entryValue] of Object.entries(video)) {
    if (entryValue === undefined) {
      continue;
    }

    if (typeof entryValue === "boolean" || typeof entryValue === "number") {
      lines.push(`  ${entryKey}: ${entryValue}`);
      continue;
    }

    lines.push(`  ${entryKey}: ${yamlString(entryValue)}`);
  }

  return lines;
};

const formatYamlVideoList = (key, videos) => {
  if (!Array.isArray(videos) || videos.length === 0) {
    return [];
  }

  return [
    `${key}:`,
    ...videos.flatMap((video) => {
      const entries = Object.entries(video).filter(([, value]) => value !== undefined);

      return [
        "  -",
        ...entries.map(([entryKey, entryValue]) =>
          typeof entryValue === "boolean" || typeof entryValue === "number"
            ? `    ${entryKey}: ${entryValue}`
            : `    ${entryKey}: ${yamlString(entryValue)}`
        ),
      ];
    }),
  ];
};

const parseArgs = (argv) => {
  const options = {
    dryRun: false,
    skipUpload: false,
    manifestPath: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--skip-upload") {
      options.skipUpload = true;
      continue;
    }

    if (arg === "--manifest") {
      options.manifestPath = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.log(usage);
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.manifestPath) {
    throw new Error("Missing required --manifest argument.");
  }

  return options;
};

const slugify = (value) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const parseJsonManifest = async (manifestPath) => {
  const manifestSource = await readFile(manifestPath, "utf8");

  try {
    return JSON.parse(manifestSource);
  } catch (error) {
    throw new Error(
      `Could not parse JSON manifest at ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

const runCommand = (command, args, { stdio = "pipe" } = {}) =>
  new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { stdio });
    let stdout = "";
    let stderr = "";

    if (child.stdout) {
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on("error", rejectPromise);
    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise({ stdout, stderr });
        return;
      }

      rejectPromise(
        new Error(
          `${command} ${args.join(" ")} exited with code ${code}${
            stderr ? `\n${stderr.trim()}` : ""
          }`
        )
      );
    });
  });

const hasCommand = async (command) => {
  const cached = commandAvailability.get(command);

  if (cached !== undefined) {
    return cached;
  }

  try {
    await runCommand("which", [command]);
    commandAvailability.set(command, true);
    return true;
  } catch {
    commandAvailability.set(command, false);
    return false;
  }
};

const resolveManifestPath = (manifestDir, assetPath) =>
  isAbsolute(assetPath) ? resolve(assetPath) : resolve(manifestDir, assetPath);

const ensureFile = async (filePath, label) => {
  if (!existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`);
  }

  const fileStat = await stat(filePath);

  if (!fileStat.isFile()) {
    throw new Error(`${label} must be a file: ${filePath}`);
  }
};

const ensureImageSource = async (filePath) => {
  await ensureFile(filePath, "Image source");

  if (!imageExtensions.has(extname(filePath).toLowerCase())) {
    throw new Error(`Unsupported image file type: ${filePath}`);
  }
};

const ensureVideoSource = async (filePath) => {
  await ensureFile(filePath, "Video source");

  if (!videoExtensions.has(extname(filePath).toLowerCase())) {
    throw new Error(`Unsupported video file type: ${filePath}`);
  }
};

const normalizeStringList = (value, label) => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${label} must be an array of strings.`);
  }

  return value.map((item) => item.trim()).filter(Boolean);
};

const normalizeCredits = (value) => {
  if (value === undefined) {
    return [];
  }

  if (
    !Array.isArray(value) ||
    value.some(
      (item) =>
        !item ||
        typeof item !== "object" ||
        typeof item.role !== "string" ||
        typeof item.name !== "string"
    )
  ) {
    throw new Error("credits must be an array of { role, name } objects.");
  }

  return value
    .map((item) => ({
      role: item.role.trim(),
      name: item.name.trim(),
    }))
    .filter((item) => item.role && item.name);
};

const normalizeHoverPreview = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (
    !value ||
    typeof value !== "object" ||
    typeof value.startTime !== "number" ||
    (value.endTime !== undefined && typeof value.endTime !== "number")
  ) {
    throw new Error("hoverPreview must be an object with numeric startTime and optional endTime.");
  }

  if (value.endTime !== undefined && value.endTime <= value.startTime) {
    throw new Error("hoverPreview.endTime must be greater than hoverPreview.startTime.");
  }

  return {
    startTime: value.startTime,
    endTime: value.endTime,
  };
};

const readExistingOrder = async (slug) => {
  const existingContentPath = resolve(projectContentDir, `${slug}.md`);

  if (!existsSync(existingContentPath)) {
    return undefined;
  }

  const existingSource = await readFile(existingContentPath, "utf8");
  const match = existingSource.match(/^order:\s*(\d+)\s*$/m);

  return match ? Number.parseInt(match[1], 10) : undefined;
};

const readNextProjectOrder = async () => {
  const filenames = await readdir(projectContentDir);
  const orders = [];

  for (const filename of filenames) {
    if (!filename.endsWith(".md")) {
      continue;
    }

    const source = await readFile(resolve(projectContentDir, filename), "utf8");
    const match = source.match(/^order:\s*(\d+)\s*$/m);

    if (match) {
      orders.push(Number.parseInt(match[1], 10));
    }
  }

  return orders.length > 0 ? Math.max(...orders) + 1 : 1;
};

const parseSipsDimensions = (stdout) => {
  const widthMatch = stdout.match(/pixelWidth:\s*(\d+)/);
  const heightMatch = stdout.match(/pixelHeight:\s*(\d+)/);

  if (!widthMatch || !heightMatch) {
    return null;
  }

  return {
    width: Number.parseInt(widthMatch[1], 10),
    height: Number.parseInt(heightMatch[1], 10),
  };
};

const getImageDimensions = async (sourcePath) => {
  if (await hasCommand("sips")) {
    const { stdout } = await runCommand("sips", ["-g", "pixelWidth", "-g", "pixelHeight", sourcePath]);

    return parseSipsDimensions(stdout);
  }

  return null;
};

const inferOrientation = (dimensions) => {
  if (!dimensions) {
    return "landscape";
  }

  if (dimensions.width >= dimensions.height * 1.45) {
    return "wide";
  }

  return dimensions.width >= dimensions.height ? "landscape" : "portrait";
};

const inferLayoutPattern = (orientation) => {
  if (orientation === "wide") {
    return "wide-band";
  }

  return orientation === "portrait" ? "support-left" : "lead-left";
};

const convertImageToJpeg = async (sourcePath, outputPath) => {
  if (await hasCommand("sips")) {
    await runCommand("sips", ["-s", "format", "jpeg", sourcePath, "--out", outputPath]);
    return;
  }

  if (await hasCommand("ffmpeg")) {
    await runCommand("ffmpeg", [
      "-loglevel",
      "error",
      "-y",
      "-i",
      sourcePath,
      "-frames:v",
      "1",
      "-q:v",
      "4",
      outputPath,
    ]);
    return;
  }

  throw new Error("Could not find either sips or ffmpeg for image conversion.");
};

const generateCoverVariant = async (sourcePath, outputPath, width) => {
  if (await hasCommand("ffmpeg")) {
    await runCommand("ffmpeg", [
      "-loglevel",
      "error",
      "-y",
      "-i",
      sourcePath,
      "-nostdin",
      "-vf",
      `scale=${width}:-2:flags=lanczos`,
      "-frames:v",
      "1",
      "-q:v",
      "4",
      outputPath,
    ]);
    return;
  }

  if (await hasCommand("sips")) {
    await runCommand("sips", ["--resampleWidth", String(width), sourcePath, "--out", outputPath]);
    return;
  }

  throw new Error("Could not find either ffmpeg or sips for responsive image generation.");
};

const contentTypeForFile = (filePath) => {
  switch (extname(filePath).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".avif":
      return "image/avif";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".woff":
      return "font/woff";
    case ".woff2":
      return "font/woff2";
    case ".ttf":
      return "font/ttf";
    case ".otf":
      return "font/otf";
    case ".eot":
      return "application/vnd.ms-fontobject";
    case ".mp4":
      return "video/mp4";
    case ".mov":
      return "video/quicktime";
    case ".m4v":
      return "video/x-m4v";
    case ".webm":
      return "video/webm";
    default:
      return undefined;
  }
};

const quoteForShell = (value) => {
  if (/^[a-zA-Z0-9_./:@-]+$/.test(value)) {
    return value;
  }

  return `'${value.replace(/'/g, `'\\''`)}'`;
};

const uploadFileToR2 = async ({ filePath, objectKey, dryRun }) => {
  const commandParts = wranglerCmd.split(/\s+/).filter(Boolean);
  const command = commandParts[0];
  const args = [
    ...commandParts.slice(1),
    "r2",
    "object",
    "put",
    `${bucketName}/${objectKey}`,
    "--file",
    filePath,
    "--remote",
    "--cache-control",
    cacheControl,
  ];
  const contentType = contentTypeForFile(filePath);

  if (contentType) {
    args.push("--content-type", contentType);
  }

  if (dryRun) {
    console.log(`[dry-run] ${[command, ...args].map(quoteForShell).join(" ")}`);
    return;
  }

  console.log(`Uploading ${objectKey}`);
  await runCommand(command, args, { stdio: "inherit" });
};

const syncProjectSectionLists = async (section, slug, { dryRun }) => {
  const source = await readFile(sectionDataFile, "utf8");
  let updatedSource = source;

  for (const exportName of Object.values(sectionToExportName)) {
    const pattern = new RegExp(`export const ${exportName} = \\[(.*?)\\] as const;`, "s");
    const match = updatedSource.match(pattern);

    if (!match) {
      throw new Error(`Could not locate ${exportName} in ${sectionDataFile}`);
    }

    const currentValues = Array.from(match[1].matchAll(/"([^"]+)"/g), (entry) => entry[1]).filter(
      (value) => value !== slug
    );

    const shouldInclude = section !== "selected-work" && exportName === sectionToExportName[section];
    const nextValues = shouldInclude ? [...currentValues, slug] : currentValues;
    const replacement = `export const ${exportName} = [\n${nextValues
      .map((value) => `  "${value}",`)
      .join("\n")}\n] as const;`;

    updatedSource = updatedSource.replace(pattern, replacement);
  }

  if (updatedSource === source) {
    return;
  }

  if (dryRun) {
    console.log(`[dry-run] Would update ${relative(workspaceRoot, sectionDataFile)} for ${slug}`);
    return;
  }

  await writeFile(sectionDataFile, updatedSource);
};

const uniquePaths = (paths) => Array.from(new Set(paths));

const isInsideWorkspace = (filePath) => {
  const workspacePrefix = workspaceRoot.endsWith(sep) ? workspaceRoot : `${workspaceRoot}${sep}`;
  return filePath === workspaceRoot || filePath.startsWith(workspacePrefix);
};

const removeSourceFiles = async (paths, { dryRun }) => {
  const removablePaths = uniquePaths(paths).filter((filePath) => !isInsideWorkspace(filePath));

  if (removablePaths.length === 0) {
    return;
  }

  if (dryRun) {
    removablePaths.forEach((filePath) => {
      console.log(`[dry-run] Would delete source file ${filePath}`);
    });
    return;
  }

  for (const filePath of removablePaths) {
    await rm(filePath, { force: true });
  }
};

const writeProjectContent = async (project, { dryRun }) => {
  const contentPath = resolve(projectContentDir, `${project.slug}.md`);
  const lines = [
    "---",
    `title: ${yamlString(project.title)}`,
    `slug: ${yamlString(project.slug)}`,
    `image: ${yamlString(project.image)}`,
    `descriptor: ${yamlString(project.descriptor)}`,
    ...formatYamlVideo("video", project.video),
    ...formatYamlVideoList("detailVideos", project.detailVideos),
    ...formatYamlVideo("hoverPreview", project.hoverPreview),
    ...formatYamlStringList("detailImages", project.detailImages),
    ...formatYamlStringList("metadata", project.metadata),
    ...formatYamlObjectList("credits", project.credits),
    `order: ${project.order}`,
    `layoutPattern: ${yamlString(project.layoutPattern)}`,
    `visualWeight: ${yamlString(project.visualWeight)}`,
    `orientation: ${yamlString(project.orientation)}`,
    `cropFocus: ${yamlString(project.cropFocus)}`,
    `status: ${yamlString(project.status)}`,
    "---",
    "",
    project.body?.trim() ? project.body.trim() : "",
    "",
  ];

  if (dryRun) {
    console.log(`[dry-run] Would write ${relative(workspaceRoot, contentPath)}`);
    return contentPath;
  }

  await mkdir(projectContentDir, { recursive: true });
  await writeFile(contentPath, `${lines.join("\n")}`.trimEnd() + "\n");

  return contentPath;
};

const writePostContent = async (post, { dryRun }) => {
  const contentPath = resolve(postContentDir, `${post.slug}.md`);
  const lines = [
    "---",
    `title: ${yamlString(post.title)}`,
    `excerpt: ${yamlString(post.excerpt)}`,
    `publishedAt: ${yamlString(post.publishedAt)}`,
    ...(post.coverImage ? [`coverImage: ${yamlString(post.coverImage)}`] : []),
    ...(post.coverAlt ? [`coverAlt: ${yamlString(post.coverAlt)}`] : []),
    ...formatYamlStringList("galleryImages", post.galleryImages),
    `status: ${yamlString(post.status)}`,
    "---",
    "",
    post.body?.trim() ? post.body.trim() : "",
    "",
  ];

  if (dryRun) {
    console.log(`[dry-run] Would write ${relative(workspaceRoot, contentPath)}`);
    return contentPath;
  }

  await mkdir(postContentDir, { recursive: true });
  await writeFile(contentPath, `${lines.join("\n")}`.trimEnd() + "\n");

  return contentPath;
};

const stageProjectAssets = async (project, stageRoot) => {
  const objectBasePath =
    project.section === "mixed-media"
      ? `projects/mixed-media/${project.slug}`
      : `projects/${project.slug}`;
  const storageBasePath =
    project.section === "mixed-media"
      ? join(stageRoot, "projects", "mixed-media", project.slug)
      : join(stageRoot, "projects", project.slug);
  const photosDir = join(storageBasePath, "photos");

  await mkdir(photosDir, { recursive: true });

  const uploadEntries = [];
  const detailImages = [];

  for (let index = 0; index < project.images.length; index += 1) {
    const sourceImage = project.images[index];
    const filename = index === 0 ? "cover.jpg" : `detail-${String(index).padStart(2, "0")}.jpg`;
    const destination = join(photosDir, filename);

    await convertImageToJpeg(sourceImage, destination);
    uploadEntries.push({
      filePath: destination,
      objectKey: `${objectBasePath}/photos/${filename}`,
    });

    if (index > 0) {
      detailImages.push(`/projects/${project.slug}/photos/${filename}`);
    }
  }

  const coverSource = join(photosDir, "cover.jpg");

  for (const width of coverWidths) {
    const variantPath = join(photosDir, `cover-${width}.jpg`);
    await generateCoverVariant(coverSource, variantPath, width);
    uploadEntries.push({
      filePath: variantPath,
      objectKey: `${objectBasePath}/photos/cover-${width}.jpg`,
    });
  }

  const detailVideos = [];
  let heroVideo;

  for (let index = 0; index < project.videos.length; index += 1) {
    const sourceVideo = project.videos[index];
    const extension = extname(sourceVideo).toLowerCase();
    const filename = index === 0 ? `feature${extension}` : `detail-${String(index).padStart(2, "0")}${extension}`;
    const publicSrc = `/projects/${project.slug}/videos/${filename}`;
    uploadEntries.push({
      filePath: sourceVideo,
      objectKey: `${objectBasePath}/videos/${filename}`,
    });
    const videoEntry = {
      src: publicSrc,
      poster: `/projects/${project.slug}/photos/cover.jpg`,
      controls: true,
    };

    if (index === 0) {
      heroVideo = videoEntry;
    } else {
      detailVideos.push(videoEntry);
    }
  }

  return {
    uploadEntries,
    image: `/projects/${project.slug}/photos/cover.jpg`,
    detailImages,
    video: heroVideo,
    detailVideos,
  };
};

const stagePostAssets = async (post, stageRoot) => {
  const storageBasePath = join(stageRoot, "blog", post.slug);
  await mkdir(storageBasePath, { recursive: true });

  if (post.images.length === 0) {
    return {
      uploadEntries: [],
      coverImage: undefined,
      galleryImages: [],
    };
  }

  const uploadEntries = [];
  const coverPath = join(storageBasePath, "cover.jpg");
  await convertImageToJpeg(post.images[0], coverPath);
  uploadEntries.push({
    filePath: coverPath,
    objectKey: `blog/${post.slug}/cover.jpg`,
  });

  for (const width of coverWidths) {
    const variantPath = join(storageBasePath, `cover-${width}.jpg`);
    await generateCoverVariant(coverPath, variantPath, width);
    uploadEntries.push({
      filePath: variantPath,
      objectKey: `blog/${post.slug}/cover-${width}.jpg`,
    });
  }

  const galleryImages = [];

  for (let index = 1; index < post.images.length; index += 1) {
    const filename = `detail-${String(index).padStart(2, "0")}.jpg`;
    const destination = join(storageBasePath, filename);

    await convertImageToJpeg(post.images[index], destination);
    uploadEntries.push({
      filePath: destination,
      objectKey: `blog/${post.slug}/${filename}`,
    });
    galleryImages.push(`/blog/${post.slug}/${filename}`);
  }

  return {
    uploadEntries,
    coverImage: `/blog/${post.slug}/cover.jpg`,
    galleryImages,
  };
};

const validateProjectManifest = async (manifest, manifestDir) => {
  if (!manifest || typeof manifest !== "object") {
    throw new Error("Project manifest must be an object.");
  }

  if (manifest.type !== "project") {
    throw new Error(`Expected manifest.type to be "project", received ${manifest.type}`);
  }

  if (typeof manifest.title !== "string" || !manifest.title.trim()) {
    throw new Error("Project manifest must include a title.");
  }

  if (typeof manifest.descriptor !== "string" || !manifest.descriptor.trim()) {
    throw new Error("Project manifest must include a descriptor.");
  }

  if (typeof manifest.section !== "string" || !supportedProjectSections.has(manifest.section)) {
    throw new Error(
      `Project section must be one of: ${Array.from(supportedProjectSections).join(", ")}`
    );
  }

  const slug = manifest.slug?.trim() ? slugify(manifest.slug) : slugify(manifest.title);

  if (!slug) {
    throw new Error("Could not derive a slug from the project title.");
  }

  const images = normalizeStringList(manifest.images, "images").map((assetPath) =>
    resolveManifestPath(manifestDir, assetPath)
  );

  if (images.length === 0) {
    throw new Error("Project manifests require at least one image.");
  }

  const videos = normalizeStringList(manifest.videos, "videos").map((assetPath) =>
    resolveManifestPath(manifestDir, assetPath)
  );

  for (const imagePath of images) {
    await ensureImageSource(imagePath);
  }

  for (const videoPath of videos) {
    await ensureVideoSource(videoPath);
  }

  const dimensions = await getImageDimensions(images[0]);
  const orientation = manifest.orientation ?? inferOrientation(dimensions);
  const normalizedOrientation = typeof orientation === "string" ? orientation : "landscape";
  const order =
    typeof manifest.order === "number"
      ? manifest.order
      : (await readExistingOrder(slug)) ?? (await readNextProjectOrder());

  if (!Number.isInteger(order) || order <= 0) {
    throw new Error("order must be a positive integer.");
  }

  if (manifest.layoutPattern && !layoutPatterns.has(manifest.layoutPattern)) {
    throw new Error(`layoutPattern must be one of: ${Array.from(layoutPatterns).join(", ")}`);
  }

  if (manifest.visualWeight && !visualWeights.has(manifest.visualWeight)) {
    throw new Error(`visualWeight must be one of: ${Array.from(visualWeights).join(", ")}`);
  }

  if (!orientations.has(normalizedOrientation)) {
    throw new Error(`orientation must be one of: ${Array.from(orientations).join(", ")}`);
  }

  if (manifest.cropFocus && !cropFocusValues.has(manifest.cropFocus)) {
    throw new Error(`cropFocus must be one of: ${Array.from(cropFocusValues).join(", ")}`);
  }

  return {
    type: "project",
    title: manifest.title.trim(),
    slug,
    section: manifest.section,
    descriptor: manifest.descriptor.trim(),
    body: typeof manifest.body === "string" ? manifest.body : "",
    metadata: normalizeStringList(manifest.metadata, "metadata"),
    credits: normalizeCredits(manifest.credits),
    hoverPreview: normalizeHoverPreview(manifest.hoverPreview),
    layoutPattern: manifest.layoutPattern ?? inferLayoutPattern(normalizedOrientation),
    visualWeight: manifest.visualWeight ?? "dominant",
    orientation: normalizedOrientation,
    cropFocus: manifest.cropFocus ?? "center",
    order,
    images,
    videos,
    deleteSourceAfterUpload: manifest.deleteSourceAfterUpload === true,
    status: manifest.section === "mixed-media" ? "mixed-media" : "published",
  };
};

const validatePostManifest = async (manifest, manifestDir) => {
  if (!manifest || typeof manifest !== "object") {
    throw new Error("Blog manifest must be an object.");
  }

  if (!["blog-post", "post"].includes(manifest.type)) {
    throw new Error(`Expected manifest.type to be "blog-post" or "post", received ${manifest.type}`);
  }

  if (typeof manifest.title !== "string" || !manifest.title.trim()) {
    throw new Error("Blog manifest must include a title.");
  }

  if (typeof manifest.excerpt !== "string" || !manifest.excerpt.trim()) {
    throw new Error("Blog manifest must include an excerpt.");
  }

  const slug = manifest.slug?.trim() ? slugify(manifest.slug) : slugify(manifest.title);

  if (!slug) {
    throw new Error("Could not derive a slug from the blog title.");
  }

  const images = normalizeStringList(manifest.images, "images").map((assetPath) =>
    resolveManifestPath(manifestDir, assetPath)
  );

  for (const imagePath of images) {
    await ensureImageSource(imagePath);
  }

  const publishedAt =
    typeof manifest.publishedAt === "string" && manifest.publishedAt.trim()
      ? new Date(manifest.publishedAt)
      : new Date();

  if (Number.isNaN(publishedAt.getTime())) {
    throw new Error("publishedAt must be a valid ISO date string.");
  }

  return {
    type: "blog-post",
    title: manifest.title.trim(),
    slug,
    excerpt: manifest.excerpt.trim(),
    body: typeof manifest.body === "string" ? manifest.body : "",
    publishedAt: publishedAt.toISOString(),
    images,
    coverAlt: typeof manifest.coverAlt === "string" ? manifest.coverAlt.trim() : manifest.title.trim(),
    deleteSourceAfterUpload: manifest.deleteSourceAfterUpload === true,
    status: manifest.status === "draft" ? "draft" : "published",
  };
};

const uploadStagedFiles = async (uploadEntries, { dryRun, skipUpload }) => {
  if (skipUpload) {
    console.log("Skipping R2 upload because --skip-upload was provided.");
    return;
  }

  if (uploadEntries.length === 0) {
    return;
  }

  if (!bucketName) {
    throw new Error("Missing R2_BUCKET_NAME environment variable.");
  }

  for (const entry of uploadEntries) {
    await uploadFileToR2({ filePath: entry.filePath, objectKey: entry.objectKey, dryRun });
  }
};

const run = async () => {
  const options = parseArgs(process.argv.slice(2));
  const manifestPath = resolve(workspaceRoot, options.manifestPath);
  const manifestDir = dirname(manifestPath);
  const manifest = await parseJsonManifest(manifestPath);
  const stageRoot = await mkdtemp(join(tmpdir(), "wxveri2-publisher-"));

  try {
    if (manifest.type === "project") {
      const project = await validateProjectManifest(manifest, manifestDir);
      const staged = await stageProjectAssets(project, stageRoot);
      const contentPayload = {
        ...project,
        ...staged,
      };

      if (contentPayload.video && project.hoverPreview) {
        contentPayload.hoverPreview = {
          ...project.hoverPreview,
          src: contentPayload.video.src,
          poster: contentPayload.video.poster,
        };
      }

      await uploadStagedFiles(staged.uploadEntries, options);
      await writeProjectContent(contentPayload, options);
      await syncProjectSectionLists(project.section, project.slug, options);

      if (!options.skipUpload && project.deleteSourceAfterUpload) {
        await removeSourceFiles([...project.images, ...project.videos], options);
      }

      console.log(`Prepared project "${project.title}" (${project.slug})`);
      return;
    }

    if (manifest.type === "blog-post" || manifest.type === "post") {
      const post = await validatePostManifest(manifest, manifestDir);
      const staged = await stagePostAssets(post, stageRoot);
      const contentPayload = {
        ...post,
        ...staged,
      };

      await uploadStagedFiles(staged.uploadEntries, options);
      await writePostContent(contentPayload, options);

      if (!options.skipUpload && post.deleteSourceAfterUpload) {
        await removeSourceFiles(post.images, options);
      }

      console.log(`Prepared blog post "${post.title}" (${post.slug})`);
      return;
    }

    throw new Error(`Unsupported manifest type: ${manifest.type}`);
  } finally {
    await rm(stageRoot, { recursive: true, force: true });
  }
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(usage);
  process.exit(1);
});
