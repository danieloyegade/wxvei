import { defineCollection, z } from "astro:content";
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

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    image: z.string(),
    descriptor: z.string(),
    order: z.number().int().positive(),
    layoutPattern: z.enum(projectLayoutPatternValues),
    visualWeight: z.enum(projectVisualWeightValues).default("standard"),
    orientation: z.enum(projectOrientationValues),
    cropFocus: z.enum(projectCropFocusValues).default("center"),
    video: projectVideoSchema.optional(),
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
    status: z.string().default("placeholder"),
  }),
});

export const collections = {
  projects,
};
