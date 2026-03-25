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
  });

const projects = defineCollection({
  type: "content",
  schema: z.object({
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
};
