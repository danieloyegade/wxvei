import { defineCollection, z } from "astro:content";
import { homepageBeatTemplateValues, projectSectionIds } from "./data/editorial";
import {
  projectCropFocusValues,
  projectLayoutPatternValues,
  projectOrientationValues,
  projectVisualWeightValues,
} from "./lib/projectLayout";

const projectVideoSchema = z.object({
  src: z.string(),
  poster: z.string().optional(),
  controls: z.boolean().optional(),
  loop: z.boolean().optional(),
  playInView: z.boolean().optional(),
  videoFirst: z.boolean().optional(),
  unmutedVolume: z.number().min(0).max(1).optional(),
});

const projectHoverPreviewSchema = z
  .object({
    src: z.string().optional(),
    poster: z.string().optional(),
    startTime: z.number().nonnegative().default(0),
    endTime: z.number().nonnegative().optional(),
  })
  .refine(
    ({ startTime, endTime }) => endTime === undefined || endTime > startTime,
    {
      message: "hoverPreview.endTime must be greater than hoverPreview.startTime",
      path: ["endTime"],
    }
  );

const projectSectionOrderSchema = z.object({
  "selected-work": z.number().int().positive().optional(),
  portraiture: z.number().int().positive().optional(),
  "mixed-media": z.number().int().positive().optional(),
  "short-films": z.number().int().positive().optional(),
});

const projectEditorialSchema = z
  .object({
    visibility: z.enum(["published", "draft"]).default("published"),
    sections: z.array(z.enum(projectSectionIds)).min(1),
    sectionOrder: projectSectionOrderSchema,
    homepage: z
      .object({
        order: z.number().int().positive(),
        template: z.enum(homepageBeatTemplateValues),
        slot: z.number().int().positive(),
      })
      .optional(),
  })
  .superRefine((editorial, context) => {
    const missingSectionOrders = editorial.sections.filter(
      (sectionId) => editorial.sectionOrder[sectionId] === undefined
    );

    if (missingSectionOrders.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Missing sectionOrder entries for: ${missingSectionOrders.join(", ")}`,
        path: ["sectionOrder"],
      });
    }

    if (editorial.homepage && !editorial.sections.includes("selected-work")) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "homepage entries must also belong to selected-work.",
        path: ["homepage"],
      });
    }

    if (editorial.sections.includes("mixed-media") && editorial.sections.length > 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'mixed-media projects cannot belong to other sections.',
        path: ["sections"],
      });
    }
  });

const selectedWorkOrder = defineCollection({
  type: "content",
  schema: z
    .object({
      beats: z
        .array(
          z.object({
            template: z.enum(homepageBeatTemplateValues),
            projects: z.array(z.string()).min(1).max(2),
          })
        )
        .min(1),
    })
    .superRefine(({ beats }, context) => {
      const usedProjectSlugs = new Set<string>();

      beats.forEach((beat, beatIndex) => {
        if (beat.template === "solo" && beat.projects.length > 1) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'The "solo" template can only include one project.',
            path: ["beats", beatIndex, "projects"],
          });
        }

        beat.projects.forEach((projectSlug, projectIndex) => {
          if (usedProjectSlugs.has(projectSlug)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Duplicate selected work project: ${projectSlug}`,
              path: ["beats", beatIndex, "projects", projectIndex],
            });
          }

          usedProjectSlugs.add(projectSlug);
        });
      });
    }),
});

const mixedMediaAssetPathPrefix = "/projects/mixed-media/";

const collectProjectMediaPaths = (
  project: {
    image: string;
    video?: z.infer<typeof projectVideoSchema>;
    detailVideos?: z.infer<typeof projectVideoSchema>[];
    hoverPreview?: z.infer<typeof projectHoverPreviewSchema>;
    detailImages?: string[];
  }
) => [
  { value: project.image, path: ["image"] },
  { value: project.video?.src, path: ["video", "src"] },
  { value: project.video?.poster, path: ["video", "poster"] },
  ...(project.detailVideos?.flatMap((detailVideo, index) => [
    { value: detailVideo.src, path: ["detailVideos", index, "src"] },
    { value: detailVideo.poster, path: ["detailVideos", index, "poster"] },
  ]) ?? []),
  { value: project.hoverPreview?.src, path: ["hoverPreview", "src"] },
  { value: project.hoverPreview?.poster, path: ["hoverPreview", "poster"] },
  ...(project.detailImages?.map((detailImage, index) => ({
    value: detailImage,
    path: ["detailImages", index],
  })) ?? []),
];

const projects = defineCollection({
  type: "content",
  schema: z
    .object({
      title: z.string(),
      image: z.string(),
      descriptor: z.string(),
      layoutPattern: z.enum(projectLayoutPatternValues),
      visualWeight: z.enum(projectVisualWeightValues).default("standard"),
      orientation: z.enum(projectOrientationValues),
      cropFocus: z.enum(projectCropFocusValues).default("center"),
      selectedWorkAspectRatio: z.string().optional(),
      video: projectVideoSchema.optional(),
      detailVideos: z.array(projectVideoSchema).optional(),
      hoverPreview: projectHoverPreviewSchema.optional(),
      detailImages: z.array(z.string()).optional(),
      metadata: z.array(z.string()).optional(),
      credits: z
        .array(
          z.object({
            role: z.string(),
            name: z.string(),
          })
        )
        .optional(),
      editorial: projectEditorialSchema,
      status: z.enum(["placeholder", "published"]).default("placeholder"),
    })
    .superRefine((project, context) => {
      const isMixedMediaProject = project.editorial.sections.includes("mixed-media");

      for (const { value, path } of collectProjectMediaPaths(project)) {
        if (!value || !value.startsWith("/projects/")) {
          continue;
        }

        const usesMixedMediaAssetPath = value.startsWith(mixedMediaAssetPathPrefix);

        if (isMixedMediaProject && !usesMixedMediaAssetPath) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'mixed-media project assets must live under "/projects/mixed-media/".',
            path,
          });
        }

        if (!isMixedMediaProject && usesMixedMediaAssetPath) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'only mixed-media projects can point at "/projects/mixed-media/".',
            path,
          });
        }
      }
    }),
});

const posts = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    publishedAt: z.coerce.date(),
    coverImage: z.string().optional(),
    coverAlt: z.string().optional(),
    galleryImages: z.array(z.string()).optional(),
    status: z.enum(["draft", "published"]).default("published"),
  }),
});

export const collections = {
  projects,
  posts,
  selectedWorkOrder,
};
