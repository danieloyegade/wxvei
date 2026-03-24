import { defineCollection, z } from "astro:content";
import {
  projectCropFocusValues,
  projectLayoutPatternValues,
  projectOrientationValues,
  projectVisualWeightValues,
} from "./lib/projectLayout";

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
