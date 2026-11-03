import { z } from "zod";

/** Message conversation (frontière MemoryPort / fixtures). */
export const messageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  text: z.string(),
  createdAt: z.iso.datetime({ offset: true }),
});

export type Message = z.infer<typeof messageSchema>;

export const mailAccountStatusSchema = z.enum([
  "active",
  "disabled",
  "needs_reauth",
]);

export type MailAccountStatus = z.infer<typeof mailAccountStatusSchema>;

/** Compte / boîte mail (UI + table mail_accounts — sans jeton). */
export const mailAccountSchema = z.object({
  id: z.string().min(1),
  email: z.email(),
  /** Libellé court UI (sans `@gmail.com`). */
  label: z.string().min(1),
  status: mailAccountStatusSchema.default("active"),
});

export type MailAccount = z.infer<typeof mailAccountSchema>;

/** Mail lecture seule (MailPort). */
export const mailSummarySchema = z.object({
  id: z.string().min(1),
  accountId: z.string().min(1),
  from: z.string().min(1),
  subject: z.string(),
  excerpt: z.string(),
  /** Affichage HH:MM (mock / UI). */
  time: z.string().regex(/^\d{2}:\d{2}$/, "time must be HH:MM"),
  /** Instant de réception (filtre « aujourd’hui », tris). */
  receivedAt: z.iso.datetime({ offset: true }),
  unread: z.boolean(),
  category: z.string().optional(),
  /** true = envoi (Gmail SENT) — hors feed UI, dispo agent. */
  isSent: z.boolean().optional(),
  flagged: z.boolean().optional(),
  flagReason: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
});

export type MailSummary = z.infer<typeof mailSummarySchema>;

export const githubConnectionStatusSchema = z.enum(["active", "needs_reauth"]);

export type GithubConnectionStatus = z.infer<
  typeof githubConnectionStatusSchema
>;

/** Connexion GitHub UI — sans PAT ni vault_secret_id. */
export const githubConnectionSchema = z.object({
  id: z.string().min(1),
  login: z.string().min(1),
  status: githubConnectionStatusSchema,
  expiresAt: z.iso.datetime({ offset: true }).nullable(),
  connectedAt: z.iso.datetime({ offset: true }),
});

export type GithubConnection = z.infer<typeof githubConnectionSchema>;

/** Dépôt GitHub (liste) — id = full_name `owner/repo`. */
export const repoSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  owner: z.string().min(1),
  private: z.boolean(),
  defaultBranch: z.string().min(1),
  updatedAt: z.iso.datetime({ offset: true }),
});

export type RepoSummary = z.infer<typeof repoSummarySchema>;

export const repoBranchSchema = z.object({
  name: z.string().min(1),
  protected: z.boolean(),
  isDefault: z.boolean(),
});

export type RepoBranch = z.infer<typeof repoBranchSchema>;

/** Nœud arbre fichiers — même forme que le mock UI. */
export type RepoTreeFile = {
  kind: "file";
  name: string;
  sizeLabel?: string;
  protected?: boolean;
};

export type RepoTreeDir = {
  kind: "dir";
  name: string;
  children: RepoTreeNode[];
};

export type RepoTreeNode = RepoTreeFile | RepoTreeDir;

export const repoCommitSchema = z.object({
  id: z.string().min(1),
  sha: z.string().min(1),
  message: z.string(),
  author: z.string().min(1),
  relativeTime: z.string().min(1),
  /** ISO — date absolue pour le popover détail (optionnel = cache session ancien). */
  committedAt: z.iso.datetime({ offset: true }).optional(),
});

export type RepoCommit = z.infer<typeof repoCommitSchema>;

export const repoPullSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().positive(),
  title: z.string(),
  author: z.string().min(1),
  state: z.enum(["open", "closed"]),
  relativeTime: z.string().min(1),
});

export type RepoPull = z.infer<typeof repoPullSchema>;

export const repoFileContentSchema = z.object({
  path: z.string().min(1),
  name: z.string().min(1),
  size: z.number().int().nonnegative(),
  sizeLabel: z.string(),
  linesLabel: z.string().optional(),
  kind: z.enum(["nominal", "tooLarge", "binary", "empty"]),
  content: z.string().optional(),
  htmlUrl: z.string().url().optional(),
});

export type RepoFileContent = z.infer<typeof repoFileContentSchema>;

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

/** Profil utilisateur (frontière ProfilePort / table `profiles`). */
export const userProfileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().nullable(),
  username: z.string().nullable(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

/** Identifiants email/mot de passe — Auth Supabase. */
export const authCredentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});

export type AuthCredentials = z.infer<typeof authCredentialsSchema>;

export const authRegisterSchema = authCredentialsSchema
  .extend({
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "password_mismatch",
  });

export type AuthRegisterInput = z.infer<typeof authRegisterSchema>;
