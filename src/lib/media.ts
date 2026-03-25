const protocolPattern = /^[a-z][a-z\d+\-.]*:/i;
const protocolRelativePattern = /^\/\//;

type MediaSourceMode = "local" | "remote";

const normalizeBaseUrl = (value?: string) => value?.trim().replace(/\/+$/, "");

const normalizeSourceMode = (value?: string): MediaSourceMode =>
  value?.trim().toLowerCase() === "remote" ? "remote" : "local";

const publicMediaBaseUrl = normalizeBaseUrl(import.meta.env.PUBLIC_MEDIA_BASE_URL);
const publicProjectVideoBaseUrl =
  normalizeBaseUrl(import.meta.env.PUBLIC_PROJECT_VIDEO_BASE_URL) ?? publicMediaBaseUrl;
const publicProjectImageBaseUrl = publicMediaBaseUrl;

const publicImageSource = normalizeSourceMode(import.meta.env.PUBLIC_IMAGE_SOURCE);
const publicVideoSource = normalizeSourceMode(import.meta.env.PUBLIC_VIDEO_SOURCE);

export const isRemoteUrl = (src: string) =>
  protocolPattern.test(src) || protocolRelativePattern.test(src);

const isProjectImagePath = (src: string) =>
  src.startsWith("/projects/") || src.startsWith("/site/photos/");

const isProjectVideoPath = (src: string) =>
  src.startsWith("/projects/") && src.includes("/videos/");

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
