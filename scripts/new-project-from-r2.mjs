#!/usr/bin/env node

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { defaultBucketName, listR2Objects } from "./lib/r2-list.mjs";

const validSections = new Set(["selected-work", "portraiture", "mixed-media", "short-films"]);
const validHomepageTemplates = new Set(["opening", "reverse", "balanced", "split", "solo", "closing"]);
const validLayoutPatterns = new Set([
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
const validVisualWeights = new Set(["support", "standard", "dominant", "hero"]);
const validOrientations = new Set(["portrait", "landscape", "wide"]);
const validCropFocusValues = new Set(["center", "top", "upper-third"]);
const validImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);
const usage = `Usage:
  npm run project:new:r2 -- --title "Project Title" --prefix projects/slug/photos/ --section portraiture:1 --descriptor "Manchester 2026."

Required:
  --title <value>
  --prefix <r2-prefix>
  --section <section-id:order>   Repeat for multiple sections
  --descriptor <value>

Optional:
  --slug <value>                 Defaults to a slugified title
  --metadata <value>             Repeat for multiple lines
  --credit <role:name>           Repeat for multiple credits
  --hero <filename-or-path>      Defaults to cover.* if present, otherwise the first image
  --detail-limit <number|all>    Defaults to all non-hero images
  --include-hero-in-details      Include the hero image in detailImages
  --layout-pattern <value>       Default: lead-left
  --visual-weight <value>        Default: standard
  --orientation <value>          Default: landscape
  --crop-focus <value>           Default: center
  --selected-work-aspect-ratio <value>
  --homepage <order:template:slot>
  --visibility <published|draft> Default: draft
  --status <placeholder|published> Default: placeholder
  --filename <name.md>           Default: <slug>.md
  --body <text>
  --bucket <bucket-name>         Default: ${defaultBucketName}
  --dry-run                      Print the file instead of writing it

Examples:
  npm run project:new:r2 -- --title "Tolu" --slug tolu --prefix projects/tolu/photos/ --section portraiture:1 --descriptor "Manchester 2026." --metadata "Manchester 2026"
  npm run project:new:r2 -- --title "Example" --prefix projects/example/photos/ --section selected-work:12 --section portraiture:7 --homepage 6:closing:2 --descriptor "Portrait study."
`;

const projectContentDir = resolve(process.cwd(), "src/content/projects");

const slugify = (value) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const yamlString = (value) => JSON.stringify(value);

const fileStem = (value) => value.toLowerCase().replace(/\.[^.]+$/, "");

const looksLikeImagePath = (value) => {
  const lowerValue = value.toLowerCase();

  for (const extension of validImageExtensions) {
    if (lowerValue.endsWith(extension)) {
      return true;
    }
  }

  return false;
};

const parseSection = (value) => {
  const [sectionId, rawOrder] = value.split(":");
  const order = Number(rawOrder);

  if (!validSections.has(sectionId)) {
    throw new Error(`Invalid section "${sectionId}".`);
  }

  if (!Number.isInteger(order) || order <= 0) {
    throw new Error(`Section "${value}" must include a positive integer order, e.g. portraiture:1.`);
  }

  return { id: sectionId, order };
};

const parseHomepage = (value) => {
  const [rawOrder, template, rawSlot] = value.split(":");
  const order = Number(rawOrder);
  const slot = Number(rawSlot);

  if (!Number.isInteger(order) || order <= 0) {
    throw new Error(`Homepage value "${value}" must start with a positive order.`);
  }

  if (!validHomepageTemplates.has(template)) {
    throw new Error(`Invalid homepage template "${template}".`);
  }

  if (!Number.isInteger(slot) || slot <= 0) {
    throw new Error(`Homepage value "${value}" must end with a positive slot.`);
  }

  return { order, template, slot };
};

const parseCredit = (value) => {
  const separatorIndex = value.indexOf(":");

  if (separatorIndex === -1) {
    throw new Error(`Credit "${value}" must use the format Role:Name.`);
  }

  const role = value.slice(0, separatorIndex).trim();
  const name = value.slice(separatorIndex + 1).trim();

  if (!role || !name) {
    throw new Error(`Credit "${value}" must include both a role and a name.`);
  }

  return { role, name };
};

const parseArgs = (argv) => {
  const options = {
    title: "",
    slug: "",
    prefix: "",
    sections: [],
    descriptor: "",
    metadata: [],
    credits: [],
    hero: "",
    detailLimit: "all",
    includeHeroInDetails: false,
    layoutPattern: "lead-left",
    visualWeight: "standard",
    orientation: "landscape",
    cropFocus: "center",
    selectedWorkAspectRatio: "",
    homepage: null,
    visibility: "draft",
    status: "placeholder",
    filename: "",
    body: "",
    bucketName: process.env.R2_BUCKET_NAME?.trim() || defaultBucketName,
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

    if (arg === "--title") {
      options.title = nextValue();
      continue;
    }

    if (arg === "--slug") {
      options.slug = nextValue();
      continue;
    }

    if (arg === "--prefix") {
      options.prefix = nextValue();
      continue;
    }

    if (arg === "--section") {
      options.sections.push(parseSection(nextValue()));
      continue;
    }

    if (arg === "--descriptor") {
      options.descriptor = nextValue();
      continue;
    }

    if (arg === "--metadata") {
      options.metadata.push(nextValue());
      continue;
    }

    if (arg === "--credit") {
      options.credits.push(parseCredit(nextValue()));
      continue;
    }

    if (arg === "--hero") {
      options.hero = nextValue();
      continue;
    }

    if (arg === "--detail-limit") {
      options.detailLimit = nextValue();
      continue;
    }

    if (arg === "--include-hero-in-details") {
      options.includeHeroInDetails = true;
      continue;
    }

    if (arg === "--layout-pattern") {
      options.layoutPattern = nextValue();
      continue;
    }

    if (arg === "--visual-weight") {
      options.visualWeight = nextValue();
      continue;
    }

    if (arg === "--orientation") {
      options.orientation = nextValue();
      continue;
    }

    if (arg === "--crop-focus") {
      options.cropFocus = nextValue();
      continue;
    }

    if (arg === "--selected-work-aspect-ratio") {
      options.selectedWorkAspectRatio = nextValue();
      continue;
    }

    if (arg === "--homepage") {
      options.homepage = parseHomepage(nextValue());
      continue;
    }

    if (arg === "--visibility") {
      options.visibility = nextValue();
      continue;
    }

    if (arg === "--status") {
      options.status = nextValue();
      continue;
    }

    if (arg === "--filename") {
      options.filename = nextValue();
      continue;
    }

    if (arg === "--body") {
      options.body = nextValue();
      continue;
    }

    if (arg === "--bucket") {
      options.bucketName = nextValue();
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.title) {
    throw new Error("Missing required --title value.");
  }

  if (!options.prefix) {
    throw new Error("Missing required --prefix value.");
  }

  if (options.sections.length === 0) {
    throw new Error("At least one --section <section-id:order> is required.");
  }

  if (!options.descriptor) {
    throw new Error("Missing required --descriptor value.");
  }

  if (!options.slug) {
    options.slug = slugify(options.title);
  }

  if (!options.slug) {
    throw new Error("Could not derive a slug. Pass --slug explicitly.");
  }

  if (!validLayoutPatterns.has(options.layoutPattern)) {
    throw new Error(`Invalid --layout-pattern value "${options.layoutPattern}".`);
  }

  if (!validVisualWeights.has(options.visualWeight)) {
    throw new Error(`Invalid --visual-weight value "${options.visualWeight}".`);
  }

  if (!validOrientations.has(options.orientation)) {
    throw new Error(`Invalid --orientation value "${options.orientation}".`);
  }

  if (!validCropFocusValues.has(options.cropFocus)) {
    throw new Error(`Invalid --crop-focus value "${options.cropFocus}".`);
  }

  if (!["published", "draft"].includes(options.visibility)) {
    throw new Error(`Invalid --visibility value "${options.visibility}".`);
  }

  if (!["placeholder", "published"].includes(options.status)) {
    throw new Error(`Invalid --status value "${options.status}".`);
  }

  if (options.homepage && !options.sections.some((section) => section.id === "selected-work")) {
    throw new Error("--homepage can only be used when one section is selected-work.");
  }

  if (options.sections.some((section) => section.id === "mixed-media") && options.sections.length > 1) {
    throw new Error("mixed-media projects cannot belong to other sections.");
  }

  const detailLimitValue = String(options.detailLimit).toLowerCase();

  if (detailLimitValue !== "all") {
    const detailLimit = Number(detailLimitValue);

    if (!Number.isInteger(detailLimit) || detailLimit < 0) {
      throw new Error(`Invalid --detail-limit value "${options.detailLimit}".`);
    }

    options.detailLimit = detailLimit;
  } else {
    options.detailLimit = "all";
  }

  if (!options.filename) {
    options.filename = `${options.slug}.md`;
  }

  if (!options.filename.endsWith(".md")) {
    options.filename = `${options.filename}.md`;
  }

  if (!options.body) {
    options.body = `Placeholder content for ${options.title}.`;
  }

  return options;
};

const pickHeroImage = (images, requestedHero) => {
  if (images.length === 0) {
    throw new Error("No image files were found in the provided R2 prefix.");
  }

  if (requestedHero) {
    const normalizedHero = requestedHero.trim().toLowerCase();
    const matchedImage = images.find((image) => {
      const candidates = [image.path.toLowerCase(), image.key.toLowerCase(), basename(image.path).toLowerCase()];

      return candidates.includes(normalizedHero);
    });

    if (!matchedImage) {
      throw new Error(`Could not find a hero image matching "${requestedHero}" in the R2 prefix.`);
    }

    return matchedImage;
  }

  const coverImage = images.find((image) => /^cover\./i.test(basename(image.path)));

  return coverImage ?? images[0];
};

const buildProjectFrontmatter = ({
  title,
  slug,
  image,
  descriptor,
  detailImages,
  metadata,
  credits,
  layoutPattern,
  visualWeight,
  orientation,
  selectedWorkAspectRatio,
  cropFocus,
  visibility,
  sections,
  homepage,
  status,
}) => {
  const lines = [
    "---",
    `title: ${yamlString(title)}`,
    `slug: ${yamlString(slug)}`,
    `image: ${yamlString(image)}`,
    `descriptor: ${yamlString(descriptor)}`,
  ];

  if (detailImages.length > 0) {
    lines.push("detailImages:", ...detailImages.map((detailImage) => `  - ${yamlString(detailImage)}`));
  }

  if (metadata.length > 0) {
    lines.push("metadata:", ...metadata.map((entry) => `  - ${yamlString(entry)}`));
  }

  if (credits.length > 0) {
    lines.push(
      "credits:",
      ...credits.flatMap((credit) => [
        "  -",
        `    role: ${yamlString(credit.role)}`,
        `    name: ${yamlString(credit.name)}`,
      ])
    );
  }

  lines.push(
    `layoutPattern: ${yamlString(layoutPattern)}`,
    `visualWeight: ${yamlString(visualWeight)}`,
    `orientation: ${yamlString(orientation)}`
  );

  if (selectedWorkAspectRatio) {
    lines.push(`selectedWorkAspectRatio: ${yamlString(selectedWorkAspectRatio)}`);
  }

  lines.push(`cropFocus: ${yamlString(cropFocus)}`);
  lines.push("editorial:");
  lines.push(`  visibility: ${yamlString(visibility)}`);
  lines.push("  sections:");
  lines.push(...sections.map((section) => `    - ${yamlString(section.id)}`));
  lines.push("  sectionOrder:");
  lines.push(...sections.map((section) => `    ${section.id}: ${section.order}`));

  if (homepage) {
    lines.push(
      "  homepage:",
      `    order: ${homepage.order}`,
      `    template: ${yamlString(homepage.template)}`,
      `    slot: ${homepage.slot}`
    );
  }

  lines.push(`status: ${yamlString(status)}`);
  lines.push("---");

  return `${lines.join("\n")}\n`;
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const objects = await listR2Objects({
    prefix: options.prefix,
    bucketName: options.bucketName,
  });
  const images = objects.filter((object) => looksLikeImagePath(object.path));

  if (images.length === 0) {
    throw new Error(`No images were found under the R2 prefix "${options.prefix}".`);
  }

  const heroImage = pickHeroImage(images, options.hero);
  const remainingImages = images.filter((image) => image.path !== heroImage.path);
  const baseDetailImages = options.includeHeroInDetails
    ? [heroImage, ...remainingImages]
    : remainingImages;
  const detailImages =
    options.detailLimit === "all"
      ? baseDetailImages
      : baseDetailImages.slice(0, options.detailLimit);

  const frontmatter = buildProjectFrontmatter({
    title: options.title,
    slug: options.slug,
    image: heroImage.path,
    descriptor: options.descriptor,
    detailImages: detailImages.map((image) => image.path),
    metadata: options.metadata,
    credits: options.credits,
    layoutPattern: options.layoutPattern,
    visualWeight: options.visualWeight,
    orientation: options.orientation,
    selectedWorkAspectRatio: options.selectedWorkAspectRatio,
    cropFocus: options.cropFocus,
    visibility: options.visibility,
    sections: options.sections,
    homepage: options.homepage,
    status: options.status,
  });
  const content = `${frontmatter}\n${options.body.trim()}\n`;
  const outputPath = resolve(projectContentDir, options.filename);

  if (options.dryRun) {
    console.log(`# ${outputPath}\n`);
    console.log(content);
    return;
  }

  if (existsSync(outputPath)) {
    throw new Error(`Refusing to overwrite existing file: ${outputPath}`);
  }

  await mkdir(projectContentDir, { recursive: true });
  await writeFile(outputPath, content, "utf8");

  console.log(`Created ${outputPath}`);
  console.log(`Hero image: ${heroImage.path}`);

  if (detailImages.length > 0) {
    console.log(`Detail images: ${detailImages.length}`);
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
