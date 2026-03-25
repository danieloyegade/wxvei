import { existsSync } from "node:fs";
import { resolve } from "node:path";

interface ResponsiveVariant {
  src: string;
  width: number;
}

interface ResponsiveImageConfig {
  fallbackWidth: number;
  widths: number[];
}

interface ResponsiveImageSet {
  fallbackSrc: string;
  jpeg: ResponsiveVariant[];
}

const coverImageConfig: ResponsiveImageConfig = {
  fallbackWidth: 1440,
  widths: [640, 960, 1440, 1920],
};

const portraitImageConfig: ResponsiveImageConfig = {
  fallbackWidth: 960,
  widths: [480, 720, 960, 1280],
};

const responsiveImageConfigs: Array<[prefix: string, config: ResponsiveImageConfig]> = [
  ["/projects/", coverImageConfig],
  ["/site/photos/", portraitImageConfig],
];

const imageExtensionPattern = /\.(jpe?g)$/i;
const publicRoot = resolve(process.cwd(), "public");
const fileExistsCache = new Map<string, boolean>();

const buildVariantPath = (src: string, width: number, extension: "jpg" | "webp") =>
  src.replace(imageExtensionPattern, `-${width}.${extension}`);

const getResponsiveImageConfig = (src: string) =>
  responsiveImageConfigs.find(([prefix]) => src.startsWith(prefix))?.[1] ?? null;

const publicAssetExists = (src: string) => {
  const cachedResult = fileExistsCache.get(src);

  if (cachedResult !== undefined) {
    return cachedResult;
  }

  const exists = existsSync(resolve(publicRoot, src.replace(/^\/+/, "")));
  fileExistsCache.set(src, exists);

  return exists;
};

export const getResponsiveImageSet = (src: string): ResponsiveImageSet | null => {
  if (!imageExtensionPattern.test(src)) {
    return null;
  }

  const config = getResponsiveImageConfig(src);

  if (!config) {
    return null;
  }

  const fallbackSrc = buildVariantPath(src, config.fallbackWidth, "jpg");
  const jpeg = config.widths.map((width) => ({
    src: buildVariantPath(src, width, "jpg"),
    width,
  }));

  const hasAllVariants = [fallbackSrc, ...jpeg.map((variant) => variant.src)].every(publicAssetExists);

  if (!hasAllVariants) {
    return null;
  }

  return {
    fallbackSrc,
    jpeg,
  };
};

export const getResponsiveImageFallbackSrc = (src: string) =>
  getResponsiveImageSet(src)?.fallbackSrc ?? src;
