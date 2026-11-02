import { z } from "zod";

/** Message conversation (frontière MemoryPort / fixtures). */
export const messageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  text: z.string(),
  createdAt: z.iso.datetime({ offset: true }),
});

export type Message = z.infer<typeof messageSchema>;

/** Mail lecture seule (MailPort). */
export const mailSummarySchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  subject: z.string(),
  excerpt: z.string(),
  /** Affichage HH:MM (mock / UI). */
  time: z.string().regex(/^\d{2}:\d{2}$/, "time must be HH:MM"),
  unread: z.boolean(),
});

export type MailSummary = z.infer<typeof mailSummarySchema>;

export const riskLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export type RiskLevel = z.infer<typeof riskLevelSchema>;

/** Proposition d'action — jamais exécutée par le LLM. */
export const actionProposalSchema = z.object({
  id: z.string().min(1),
  command: z.string().min(1),
  cwd: z.string().min(1),
  machine: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
  }),
  explanation: z.string().min(1),
  risk: riskLevelSchema,
  expiresAt: z.iso.datetime({ offset: true }),
});

export type ActionProposal = z.infer<typeof actionProposalSchema>;

export const journalStatusSchema = z.enum([
  "succeeded",
  "failed",
  "cancelled",
  "expired",
]);

export const journalEntrySchema = z.object({
  id: z.string().min(1),
  actionId: z.string().min(1),
  command: z.string().min(1),
  status: journalStatusSchema,
  startedAt: z.iso.datetime({ offset: true }),
  durationMs: z.number().int().nonnegative(),
  exitCode: z.number().int().optional(),
  output: z.string().optional(),
});

export type JournalEntry = z.infer<typeof journalEntrySchema>;

export const actionEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("stdout"), line: z.string() }),
  z.object({ type: z.literal("stderr"), line: z.string() }),
  z.object({ type: z.literal("done"), exitCode: z.number().int() }),
]);

export type ActionEvent = z.infer<typeof actionEventSchema>;
