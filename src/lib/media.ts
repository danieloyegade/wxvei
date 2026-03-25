const protocolPattern = /^[a-z][a-z\d+\-.]*:/i;
const protocolRelativePattern = /^\/\//;

type MediaSourceMode = "local" | "remote";

const normalizeBaseUrl = (value?: string) => value?.trim().replace(/\/+$/, "");

const normalizeSourceMode = (value?: string): MediaSourceMode =>
  value?.trim().toLowerCase() === "remote" ? "remote" : "local";

const publicAssetSource = normalizeSourceMode(import.meta.env.PUBLIC_ASSET_SOURCE);
const publicMediaBaseUrl = normalizeBaseUrl(import.meta.env.PUBLIC_MEDIA_BASE_URL);
const publicProjectVideoBaseUrl =
  normalizeBaseUrl(import.meta.env.PUBLIC_PROJECT_VIDEO_BASE_URL) ?? publicMediaBaseUrl;
const publicProjectImageBaseUrl = publicMediaBaseUrl;

const publicImageSource = normalizeSourceMode(
  import.meta.env.PUBLIC_IMAGE_SOURCE ?? import.meta.env.PUBLIC_ASSET_SOURCE
);
const publicVideoSource = normalizeSourceMode(
  import.meta.env.PUBLIC_VIDEO_SOURCE ?? import.meta.env.PUBLIC_ASSET_SOURCE
);

const mediaConfigurationErrors = [
  publicAssetSource === "remote" && !publicMediaBaseUrl
    ? "PUBLIC_ASSET_SOURCE=remote requires PUBLIC_MEDIA_BASE_URL."
    : "",
  publicImageSource === "remote" && !publicProjectImageBaseUrl
    ? "PUBLIC_IMAGE_SOURCE=remote requires PUBLIC_MEDIA_BASE_URL."
    : "",
  publicVideoSource === "remote" && !publicProjectVideoBaseUrl
    ? "PUBLIC_VIDEO_SOURCE=remote requires PUBLIC_PROJECT_VIDEO_BASE_URL or PUBLIC_MEDIA_BASE_URL."
    : "",
].filter(Boolean);

if (mediaConfigurationErrors.length > 0) {
  throw new Error(`Invalid public media configuration:\n- ${mediaConfigurationErrors.join("\n- ")}`);
}

export const isRemoteUrl = (src: string) =>
  protocolPattern.test(src) || protocolRelativePattern.test(src);

const isProjectImagePath = (src: string) =>
  src.startsWith("/projects/") || src.startsWith("/site/photos/") || src.startsWith("/blog/");

const isProjectVideoPath = (src: string) =>
  src.startsWith("/projects/") && src.includes("/videos/");

const publishedRootAssetPaths = new Set([
  "/apple-touch-icon.png",
  "/favicon.svg",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/daniel-oyegade-favicon.svg",
]);

const isPublishedAssetPath = (src: string) =>
  src.startsWith("/projects/") ||
  src.startsWith("/site/") ||
  src.startsWith("/blog/") ||
  src.startsWith("/fonts/") ||
  publishedRootAssetPaths.has(src);

const resolveRemoteAssetUrl = (src: string, baseUrl?: string) => {
  if (!baseUrl || !src.startsWith("/")) {
    return src;
  }

  return `${baseUrl}${src}`;
};

export const usesRemoteProjectImages = () =>
  publicImageSource === "remote" && Boolean(publicProjectImageBaseUrl);

export const usesRemoteProjectVideos = () =>
  publicVideoSource === "remote" && Boolean(publicProjectVideoBaseUrl);

export const usesRemotePublishedAssets = () =>
  publicAssetSource === "remote" && Boolean(publicMediaBaseUrl);

export const resolvePublishedAssetSrc = (src?: string) => {
  if (!src || isRemoteUrl(src) || !isPublishedAssetPath(src) || !usesRemotePublishedAssets()) {
    return src;
  }

  return resolveRemoteAssetUrl(src, publicMediaBaseUrl);
};

export const resolveProjectImageSrc = (src?: string) => {
  if (!src || isRemoteUrl(src) || !isProjectImagePath(src) || !usesRemoteProjectImages()) {
    return src;
  }

  return resolveRemoteAssetUrl(src, publicProjectImageBaseUrl);
};

export const resolveProjectVideoSrc = (src?: string) => {
  if (!src || isRemoteUrl(src) || !isProjectVideoPath(src) || !usesRemoteProjectVideos()) {
    return src;
  }

  return resolveRemoteAssetUrl(src, publicProjectVideoBaseUrl);
};
