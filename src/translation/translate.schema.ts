import { z } from "zod";

export const supportedLocales = ["de", "en", "th"] as const;
export const supportedContentTypes = [
  "managed-page",
  "managed-page-section",
  "project",
  "devlog",
  "generic"
] as const;
export const supportedTones = ["neutral", "personal-technical", "professional", "playful"] as const;

export const localeSchema = z.enum(supportedLocales);
export const contentTypeSchema = z.enum(supportedContentTypes);
export const toneSchema = z.enum(supportedTones);

const nonEmptyStringRecordSchema = z.record(z.string()).refine(
  (value) => Object.keys(value).length > 0,
  "fields must contain at least one entry"
);

export const translateRequestSchema = z.object({
  sourceLocale: localeSchema,
  targetLocale: localeSchema,
  contentType: contentTypeSchema,
  fields: nonEmptyStringRecordSchema,
  tone: toneSchema.optional(),
  glossary: z.record(z.string()).optional()
});

export const translateResponseSchema = z.object({
  model: z.string().min(1),
  targetLocale: localeSchema,
  fields: z.record(z.string()),
  warnings: z.array(z.string()),
  durationMs: z.number().nonnegative()
});
