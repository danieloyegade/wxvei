import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { CollectionEntry } from "astro:content";
import {
  getProjectSectionIdsForSlug,
  mixedMediaProjectSlugs,
  projectSectionConfigs,
  type ProjectSectionId,
  portraitureProjectSlugs,
  selectedWorkProjectSlugs,
  shortFilmProjectSlugs,
} from "../data/projectSections";
import { resolveProjectVideoSrc, usesRemoteProjectImages, usesRemoteProjectVideos } from "./media";
import { withBase } from "./site";

export type ProjectEntry = CollectionEntry<"projects">;

export interface ProjectSequenceLink {
  slug: string;
  title: string;
  href: string;
}

export interface ProjectSectionLink {
  id: ProjectSectionId;
  label: string;
  href: string;
  isCurrent: boolean;
}

export interface ProjectVideoAsset {
  src: string;
  poster?: string;
  controls?: boolean;
  loop?: boolean;
  playInView?: boolean;
  videoFirst?: boolean;
  unmutedVolume?: number;
}

export interface ProjectHoverPreview {
  src?: string;
  poster?: string;
  startTime: number;
  endTime?: number;
}

export {
  mixedMediaProjectSlugs,
  projectSectionConfigs,
  type ProjectSectionId,
  portraitureProjectSlugs,
  selectedWorkProjectSlugs,
  shortFilmProjectSlugs,
} from "../data/projectSections";

interface ResolvedProjectMedia {
  image: string;
  video?: ProjectVideoAsset;
  detailVideos?: ProjectVideoAsset[];
  hoverPreview?: ProjectHoverPreview;
  detailImages?: string[];
}

export const sortProjectsByOrder = (projects: ProjectEntry[]) =>
  [...projects].sort((a, b) => a.data.order - b.data.order);

const normalizeBasePath = (basePath: string) => {
  const normalizedPath = basePath.startsWith("/") ? basePath : `/${basePath}`;

  return normalizedPath.endsWith("/") ? normalizedPath : `${normalizedPath}/`;
};

export const projectPath = (slug: string, basePath = "/selected-work/") =>
  withBase(`${normalizeBasePath(basePath)}${slug}/`);

export const getProjectsBySlugs = (projects: ProjectEntry[], slugs: readonly string[]) => {
  const projectMap = new Map(projects.map((project) => [project.slug, project]));

  return slugs.flatMap((slug) => {
    const project = projectMap.get(slug);

    return project ? [project] : [];
  });
};

export const getProjectsBySection = (projects: ProjectEntry[], sectionId: ProjectSectionId) =>
  getProjectsBySlugs(projects, projectSectionConfigs[sectionId].slugs);

export const projectHasSection = (project: ProjectEntry, sectionId: ProjectSectionId) =>
  getProjectSectionIdsForSlug(project.slug).includes(sectionId);

export const getProjectSectionLinks = (
  project: ProjectEntry,
  currentSectionId?: ProjectSectionId
): ProjectSectionLink[] =>
  getProjectSectionIdsForSlug(project.slug).map((sectionId) => ({
    id: sectionId,
    label: projectSectionConfigs[sectionId].label,
    href: withBase(projectSectionConfigs[sectionId].path),
    isCurrent: sectionId === currentSectionId,
  }));

const publicRoot = resolve(process.cwd(), "public");

const publicAssetExists = (src: string) =>
  existsSync(resolve(publicRoot, src.replace(/^\/+/, "")));

const resolveMixedMediaAssetPath = (project: ProjectEntry, src?: string) => {
  if (!src || !projectHasSection(project, "mixed-media")) {
    return src;
  }

  if (!src.startsWith("/projects/") || src.startsWith("/projects/mixed-media/")) {
    return src;
  }

  const mixedMediaSrc = src.replace(
    `/projects/${project.slug}/`,
    `/projects/mixed-media/${project.slug}/`
  );

  if (usesRemoteProjectImages() || usesRemoteProjectVideos()) {
    return mixedMediaSrc;
  }

  return publicAssetExists(mixedMediaSrc) ? mixedMediaSrc : src;
};

export const getResolvedProjectMedia = (project: ProjectEntry): ResolvedProjectMedia => ({
  image: resolveMixedMediaAssetPath(project, project.data.image) ?? project.data.image,
  video: project.data.video
    ? {
        ...project.data.video,
        src:
          resolveProjectVideoSrc(resolveMixedMediaAssetPath(project, project.data.video.src)) ??
          project.data.video.src,
        poster: resolveMixedMediaAssetPath(project, project.data.video.poster),
      }
    : undefined,
  detailVideos: project.data.detailVideos?.map((detailVideo) => ({
    ...detailVideo,
    src: resolveProjectVideoSrc(resolveMixedMediaAssetPath(project, detailVideo.src)) ?? detailVideo.src,
    poster: resolveMixedMediaAssetPath(project, detailVideo.poster),
  })),
  hoverPreview: project.data.hoverPreview
    ? {
        ...project.data.hoverPreview,
        src: resolveProjectVideoSrc(resolveMixedMediaAssetPath(project, project.data.hoverPreview.src)),
        poster: resolveMixedMediaAssetPath(project, project.data.hoverPreview.poster),
      }
    : undefined,
  detailImages: project.data.detailImages?.map(
    (detailImage) => resolveMixedMediaAssetPath(project, detailImage) ?? detailImage
  ),
});

export const mapProjectForGrid = (project: ProjectEntry) => {
  const media = getResolvedProjectMedia(project);

  return {
    slug: project.slug,
    title: project.data.title,
    image: media.image,
    descriptor: project.data.descriptor,
    order: project.data.order,
    layoutPattern: project.data.layoutPattern,
    visualWeight: project.data.visualWeight,
    orientation: project.data.orientation,
    selectedWorkAspectRatio: project.data.selectedWorkAspectRatio,
    cropFocus: project.data.cropFocus,
    video: media.video,
    hoverPreview: media.hoverPreview,
    detailImages: media.detailImages,
  };
};

const cleanInfoLine = (value: string) => value.trim().replace(/\.$/, "");

export const getProjectInfoLines = (project: ProjectEntry) => {
  const metadataLines = project.data.metadata?.map(cleanInfoLine).filter(Boolean);

  if (metadataLines && metadataLines.length > 0) {
    return metadataLines;
  }

  const creditLines = project.data.credits
    ?.map(({ role, name }) => {
      const cleanRole = role.trim();
      const cleanName = name.trim();

      if (!cleanRole || !cleanName) return "";

      return `${cleanRole} by ${cleanName}`;
    })
    .map(cleanInfoLine)
    .filter(Boolean);

  if (creditLines && creditLines.length > 0) {
    return creditLines;
  }

  const descriptor = cleanInfoLine(project.data.descriptor);

  if (!descriptor) {
    return [];
  }

  if (descriptor.includes(",")) {
    return descriptor
      .split(",")
      .map(cleanInfoLine)
      .filter(Boolean);
  }

  if (descriptor.includes(". ")) {
    return descriptor
      .split(". ")
      .map(cleanInfoLine)
      .filter(Boolean);
  }

  return [descriptor];
};

const createProjectSequence = (
  sequenceProjects: ProjectEntry[],
  slug: string,
  basePath = "/selected-work/"
) => {
  const currentIndex = sequenceProjects.findIndex((project) => project.slug === slug);

  if (currentIndex === -1) {
    throw new Error(`Project sequence could not find slug "${slug}" in its sequence group.`);
  }

  const previousProject =
    sequenceProjects[(currentIndex - 1 + sequenceProjects.length) % sequenceProjects.length];
  const nextProject = sequenceProjects[(currentIndex + 1) % sequenceProjects.length];

  return {
    previousProject: {
      slug: previousProject.slug,
      title: previousProject.data.title,
      href: projectPath(previousProject.slug, basePath),
    },
    nextProject: {
      slug: nextProject.slug,
      title: nextProject.data.title,
      href: projectPath(nextProject.slug, basePath),
    },
  };
};

export const getProjectSequence = (
  projects: ProjectEntry[],
  slug: string,
  basePath = "/selected-work/"
) => {
  const orderedProjects = sortProjectsByOrder(projects);
  const currentProject = orderedProjects.find((project) => project.slug === slug);

  if (!currentProject) {
    throw new Error(`Project sequence could not find slug "${slug}".`);
  }

  const sequenceProjects = getProjectsBySlugs(
    orderedProjects,
    projectHasSection(currentProject, "mixed-media")
      ? mixedMediaProjectSlugs
      : selectedWorkProjectSlugs
  );

  return createProjectSequence(sequenceProjects, slug, basePath);
};

export const getProjectSequenceFromSlugs = (
  projects: ProjectEntry[],
  slugs: readonly string[],
  slug: string,
  basePath: string
) => {
  const sequenceProjects = getProjectsBySlugs(projects, slugs);

  return createProjectSequence(sequenceProjects, slug, basePath);
};
