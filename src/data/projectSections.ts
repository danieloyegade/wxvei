export const selectedWorkProjectSlugs = [
  "moving-images-in-g-sharp-minor",
  "reny",
  "someplace-else",
  "mia",
  "annabella",
  "abiola",
  "these-northern-lights",
  "lola",
  "dj-paullette-for-seen-mag",
  "isaac",
  "of-the-sublime-and-beautiful",
  "jamine",
  "saucony",
] as const;

export const portraitureProjectSlugs = [
  "reny",
  "mia",
  "abiola",
  "lola",
  "dj-paullette-for-seen-mag",
  "isaac",
] as const;

export const mixedMediaProjectSlugs = [
  "rectangle-with-embellishments",
  "telfar-with-embelishments",
  "home-improvement",
  "spectres-under-glass",
] as const;

export const shortFilmProjectSlugs = [
  "moving-images-in-g-sharp-minor",
  "someplace-else",
  "of-the-sublime-and-beautiful",
] as const;

export const projectSectionIds = [
  "selected-work",
  "portraiture",
  "mixed-media",
  "short-films",
] as const;

export type ProjectSectionId = (typeof projectSectionIds)[number];

export interface ProjectSectionConfig {
  label: string;
  path: string;
  slugs: readonly string[];
}

export const projectSectionConfigs: Record<ProjectSectionId, ProjectSectionConfig> = {
  "selected-work": {
    label: "Selected Works",
    path: "/selected-work/",
    slugs: selectedWorkProjectSlugs,
  },
  portraiture: {
    label: "Portraiture",
    path: "/portraiture/",
    slugs: portraitureProjectSlugs,
  },
  "mixed-media": {
    label: "Mixed Media",
    path: "/mixed-media/",
    slugs: mixedMediaProjectSlugs,
  },
  "short-films": {
    label: "Short Films",
    path: "/short-films/",
    slugs: shortFilmProjectSlugs,
  },
};

const projectSectionSlugSets = Object.fromEntries(
  projectSectionIds.map((sectionId) => [
    sectionId,
    new Set(projectSectionConfigs[sectionId].slugs),
  ])
) as Record<ProjectSectionId, ReadonlySet<string>>;

export const getProjectSectionIdsForSlug = (slug: string) =>
  projectSectionIds.filter((sectionId) => projectSectionSlugSets[sectionId].has(slug));
