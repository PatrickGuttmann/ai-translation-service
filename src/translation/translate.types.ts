import { type z } from "zod";

import {
  type contentTypeSchema,
  type localeSchema,
  type toneSchema,
  type translateRequestSchema,
  type translateResponseSchema
} from "./translate.schema.js";

export type SupportedLocale = z.infer<typeof localeSchema>;
export type SupportedContentType = z.infer<typeof contentTypeSchema>;
export type SupportedTone = z.infer<typeof toneSchema>;
export type TranslateRequest = z.infer<typeof translateRequestSchema>;
export type TranslateResponse = z.infer<typeof translateResponseSchema>;
