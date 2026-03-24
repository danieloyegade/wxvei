export const projectLayoutPatternValues = [
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
] as const;

export const projectVisualWeightValues = ["support", "standard", "dominant", "hero"] as const;

export const projectOrientationValues = ["portrait", "landscape", "wide"] as const;

export const projectCropFocusValues = ["center", "top", "upper-third"] as const;

export type ProjectLayoutPattern = (typeof projectLayoutPatternValues)[number];
export type ProjectVisualWeight = (typeof projectVisualWeightValues)[number];
export type ProjectOrientation = (typeof projectOrientationValues)[number];
export type ProjectCropFocus = (typeof projectCropFocusValues)[number];

export const projectLayoutClasses: Record<ProjectLayoutPattern, string> = {
  "lead-left": "col-span-12 md:col-span-7 xl:col-span-7 xl:col-start-1",
  "support-right":
    "col-span-12 md:col-span-4 md:col-start-9 xl:col-span-4 xl:col-start-9 md:mt-12 xl:mt-16",
  "wide-band": "col-span-12 md:col-span-10 md:col-start-2 xl:col-span-10 xl:col-start-2",
  "support-left":
    "col-span-12 md:col-span-4 md:col-start-1 xl:col-span-4 xl:col-start-1 md:mt-10 xl:mt-14",
  "lead-right": "col-span-12 md:col-span-7 md:col-start-6 xl:col-span-7 xl:col-start-6",
  "paired-left": "col-span-12 md:col-span-5 md:col-start-2 xl:col-span-5 xl:col-start-2",
  "paired-right":
    "col-span-12 md:col-span-4 md:col-start-8 xl:col-span-4 xl:col-start-8 md:mt-8 xl:mt-12",
  "hero-left": "col-span-12 md:col-span-8 xl:col-span-7 xl:col-start-1",
  "tail-right":
    "col-span-12 md:col-span-3 md:col-start-10 xl:col-span-3 xl:col-start-10 md:mt-14 xl:mt-18",
  "offset-right": "col-span-12 md:col-span-7 md:col-start-5 xl:col-span-6 xl:col-start-6",
};

export const projectFrameClasses: Record<ProjectOrientation, string> = {
  portrait: "aspect-[4/5] md:aspect-[4/5]",
  landscape: "aspect-[5/4] md:aspect-[5/4]",
  wide: "aspect-[16/10] md:aspect-[16/10]",
};
