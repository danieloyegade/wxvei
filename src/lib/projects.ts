import type { CollectionEntry } from "astro:content";
import { withBase } from "./site";

export type ProjectEntry = CollectionEntry<"projects">;

export interface ProjectSequenceLink {
  slug: string;
  title: string;
  href: string;
}

export const sortProjectsByOrder = (projects: ProjectEntry[]) =>
  [...projects].sort((a, b) => a.data.order - b.data.order);

export const projectPath = (slug: string) => withBase(`/selected-work/${slug}/`);

export const mapProjectForGrid = (project: ProjectEntry) => ({
  slug: project.slug,
  title: project.data.title,
  image: project.data.image,
  descriptor: project.data.descriptor,
  order: project.data.order,
  layoutPattern: project.data.layoutPattern,
  visualWeight: project.data.visualWeight,
  orientation: project.data.orientation,
  cropFocus: project.data.cropFocus,
  detailImages: project.data.detailImages,
});

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

export const getProjectSequence = (projects: ProjectEntry[], slug: string) => {
  const orderedProjects = sortProjectsByOrder(projects);
  const currentProject = orderedProjects.find((project) => project.slug === slug);

  if (!currentProject) {
    throw new Error(`Project sequence could not find slug "${slug}".`);
  }

  const sequenceProjects =
    currentProject.data.status === "mixed-media"
      ? orderedProjects.filter((project) => project.data.status === "mixed-media")
      : orderedProjects.filter((project) => project.data.status !== "mixed-media");

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
      href: projectPath(previousProject.slug),
    },
    nextProject: {
      slug: nextProject.slug,
      title: nextProject.data.title,
      href: projectPath(nextProject.slug),
    },
  };
};
