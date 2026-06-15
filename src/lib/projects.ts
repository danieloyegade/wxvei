import type { CollectionEntry } from "astro:content";
import {
  projectSectionConfigs,
  projectSectionIds,
  type ProjectSectionId,
  type HomepageBeatTemplate,
} from "../data/editorial";
import { resolveProjectVideoSrc } from "./media";
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

export interface ProjectHomepagePlacement {
  order: number;
  template: HomepageBeatTemplate;
  slot: number;
}

export interface SelectedWorkOrderBeat {
  template: HomepageBeatTemplate;
  projects: string[];
}

export {
  projectSectionConfigs,
  projectSectionIds,
  type ProjectSectionId,
  type HomepageBeatTemplate,
} from "../data/editorial";

interface ResolvedProjectMedia {
  image: string;
  video?: ProjectVideoAsset;
  detailVideos?: ProjectVideoAsset[];
  hoverPreview?: ProjectHoverPreview;
  detailImages?: string[];
}

const compareNumbers = (left: number, right: number) => left - right;
const compareTitles = (left: ProjectEntry, right: ProjectEntry) =>
  left.data.title.localeCompare(right.data.title, "en", { sensitivity: "base" });

const resolveVideoPath = (src?: string) => resolveProjectVideoSrc(src) ?? src;

const isPublishedProject = (project: ProjectEntry) => project.data.editorial.visibility === "published";

const getSectionOrder = (project: ProjectEntry, sectionId: ProjectSectionId) =>
  project.data.editorial.sectionOrder[sectionId] ?? Number.MAX_SAFE_INTEGER;

const getHomepagePlacement = (project: ProjectEntry) => project.data.editorial.homepage;

export const projectPath = (slug: string, basePath = "/selected-work/") => {
  const normalizedPath = basePath.startsWith("/") ? basePath : `/${basePath}`;
  const withTrailingSlash = normalizedPath.endsWith("/") ? normalizedPath : `${normalizedPath}/`;

  return withBase(`${withTrailingSlash}${slug}/`);
};

export const getVisibleProjects = (projects: ProjectEntry[]) => projects.filter(isPublishedProject);

export const getProjectsBySection = (projects: ProjectEntry[], sectionId: ProjectSectionId) =>
  getVisibleProjects(projects)
    .filter((project) => project.data.editorial.sections.includes(sectionId))
    .sort(
      (left, right) =>
        compareNumbers(getSectionOrder(left, sectionId), getSectionOrder(right, sectionId)) ||
        compareTitles(left, right)
    );

export const getHomepageProjects = (projects: ProjectEntry[]) =>
  getVisibleProjects(projects)
    .filter((project) => Boolean(getHomepagePlacement(project)))
    .sort((left, right) => {
      const leftPlacement = getHomepagePlacement(left)!;
      const rightPlacement = getHomepagePlacement(right)!;

      return (
        compareNumbers(leftPlacement.order, rightPlacement.order) ||
        compareNumbers(leftPlacement.slot, rightPlacement.slot) ||
        compareTitles(left, right)
      );
    });

export const getSelectedWorkSequenceProjects = (
  projects: ProjectEntry[],
  beats: SelectedWorkOrderBeat[]
) => {
  const selectedWorkProjects = new Map(
    getVisibleProjects(projects)
      .filter((project) => projectHasSection(project, "selected-work"))
      .map((project) => [project.slug, project])
  );

  return beats.flatMap((beat, beatIndex) =>
    beat.projects.map((projectSlug, projectIndex) => {
      const project = selectedWorkProjects.get(projectSlug);

      if (!project) {
        throw new Error(
          `Selected work order references "${projectSlug}", but no published selected-work project with that slug exists.`
        );
      }

      return {
        ...mapProjectForGrid(project),
        homepage: {
          order: beatIndex + 1,
          template: beat.template,
          slot: projectIndex + 1,
        },
      };
    })
  );
};

export const projectHasSection = (project: ProjectEntry, sectionId: ProjectSectionId) =>
  project.data.editorial.sections.includes(sectionId);

export const getProjectSectionIdsForProject = (project: ProjectEntry) =>
  projectSectionIds.filter((sectionId) => projectHasSection(project, sectionId));

export const getProjectSectionLinks = (
  project: ProjectEntry,
  currentSectionId?: ProjectSectionId
): ProjectSectionLink[] =>
  getProjectSectionIdsForProject(project).map((sectionId) => ({
    id: sectionId,
    label: projectSectionConfigs[sectionId].label,
    href: withBase(projectSectionConfigs[sectionId].path),
    isCurrent: sectionId === currentSectionId,
  }));

export const getResolvedProjectMedia = (project: ProjectEntry): ResolvedProjectMedia => ({
  image: project.data.image,
  video: project.data.video
    ? {
        ...project.data.video,
        src: resolveVideoPath(project.data.video.src) ?? project.data.video.src,
        poster: project.data.video.poster,
      }
    : undefined,
  detailVideos: project.data.detailVideos?.map((detailVideo) => ({
    ...detailVideo,
    src: resolveVideoPath(detailVideo.src) ?? detailVideo.src,
    poster: detailVideo.poster,
  })),
  hoverPreview: project.data.hoverPreview
    ? {
        ...project.data.hoverPreview,
        src: resolveVideoPath(project.data.hoverPreview.src),
        poster: project.data.hoverPreview.poster,
      }
    : undefined,
  detailImages: project.data.detailImages,
});

export const mapProjectForGrid = (project: ProjectEntry) => {
  const media = getResolvedProjectMedia(project);

  return {
    slug: project.slug,
    title: project.data.title,
    image: media.image,
    descriptor: project.data.descriptor,
    layoutPattern: project.data.layoutPattern,
    visualWeight: project.data.visualWeight,
    orientation: project.data.orientation,
    selectedWorkAspectRatio: project.data.selectedWorkAspectRatio,
    cropFocus: project.data.cropFocus,
    video: media.video,
    hoverPreview: media.hoverPreview,
    detailImages: media.detailImages,
    homepage: project.data.editorial.homepage,
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

export const getProjectSequenceForSection = (
  projects: ProjectEntry[],
  sectionId: ProjectSectionId,
  slug: string,
  basePath: string
) => createProjectSequence(getProjectsBySection(projects, sectionId), slug, basePath);
