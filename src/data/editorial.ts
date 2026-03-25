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
  description: string;
}

export const projectSectionConfigs: Record<ProjectSectionId, ProjectSectionConfig> = {
  "selected-work": {
    label: "Selected Works",
    path: "/selected-work/",
    description: "Selected work from the Daniel Oyegade portfolio.",
  },
  portraiture: {
    label: "Portraiture",
    path: "/portraiture/",
    description:
      "Portrait commissions and editorial studies spanning portraiture, styling, and image-led collaboration.",
  },
  "mixed-media": {
    label: "Mixed Media",
    path: "/mixed-media/",
    description:
      "A cross-disciplinary edit spanning image, moving image, and looser studies in texture, atmosphere, and form.",
  },
  "short-films": {
    label: "Short Films",
    path: "/short-films/",
    description:
      "Short films and moving-image work directed by Daniel Oyegade, gathered with the still work in the same restrained register.",
  },
};

export const homepageBeatTemplateValues = [
  "opening",
  "reverse",
  "balanced",
  "split",
  "solo",
  "closing",
] as const;

export type HomepageBeatTemplate = (typeof homepageBeatTemplateValues)[number];
