import { z } from "zod";

export const ollamaChatResponseSchema = z.object({
  model: z.string(),
  created_at: z.string().optional(),
  message: z.object({
    role: z.string(),
    content: z.string()
  }),
  done: z.boolean().optional()
});

export type OllamaChatResponse = z.infer<typeof ollamaChatResponseSchema>;
