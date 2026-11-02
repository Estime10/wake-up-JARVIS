import "server-only";

import { z } from "zod";

import { GITHUB_FILE_PREVIEW_MAX_BYTES } from "@/lib/github/constants";
import { formatBytesLabel } from "@/lib/github/formatBytesLabel";
import { createLogger } from "@/lib/logger";
import { githubGet } from "@/lib/github/request";
import { repoFileContentSchema, type RepoFileContent } from "@/lib/schemas";

const log = createLogger("github.file");

const ghContentSchema = z.object({
  type: z.literal("file"),
  name: z.string(),
  path: z.string(),
  size: z.number().int().nonnegative(),
  encoding: z.string().optional(),
  content: z.string().optional(),
  html_url: z.string().url().optional(),
});

export type GetFileResult =
  | { ok: true; file: RepoFileContent }
  | {
      ok: false;
      reason: "unauthorized" | "forbidden" | "not_found" | "upstream";
    };

function looksBinary(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, Math.min(bytes.length, 8000));
  for (const byte of sample) {
    if (byte === 0) {
      return true;
    }
  }
  return false;
}

export async function getGithubFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string,
  ref: string,
): Promise<GetFileResult> {
  const result = await githubGet(
    token,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
    { ref },
  );

  if (!result.ok) {
    return { ok: false, reason: result.reason };
  }

  let json: unknown;
  try {
    json = await result.response.json();
  } catch {
    log.error("json");
    return { ok: false, reason: "upstream" };
  }

  const parsed = ghContentSchema.safeParse(json);
  if (!parsed.success) {
    log.error("shape");
    return { ok: false, reason: "upstream" };
  }

  const sizeLabel = formatBytesLabel(parsed.data.size);
  const base = {
    path: parsed.data.path,
    name: parsed.data.name,
    size: parsed.data.size,
    sizeLabel,
    ...(parsed.data.html_url ? { htmlUrl: parsed.data.html_url } : {}),
  };

  if (parsed.data.size > GITHUB_FILE_PREVIEW_MAX_BYTES) {
    return {
      ok: true,
      file: repoFileContentSchema.parse({ ...base, kind: "tooLarge" }),
    };
  }

  if (parsed.data.size === 0 || !parsed.data.content) {
    return {
      ok: true,
      file: repoFileContentSchema.parse({
        ...base,
        kind: "empty",
        content: "",
        linesLabel: "0 ligne",
      }),
    };
  }

  if (parsed.data.encoding !== "base64") {
    return {
      ok: true,
      file: repoFileContentSchema.parse({ ...base, kind: "binary" }),
    };
  }

  let bytes: Uint8Array;
  try {
    const binary = Buffer.from(
      parsed.data.content.replace(/\n/g, ""),
      "base64",
    );
    bytes = new Uint8Array(binary);
  } catch {
    log.error("base64");
    return { ok: false, reason: "upstream" };
  }

  if (looksBinary(bytes)) {
    return {
      ok: true,
      file: repoFileContentSchema.parse({ ...base, kind: "binary" }),
    };
  }

  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const lineCount = text.length === 0 ? 0 : text.split(/\r?\n/).length;

  return {
    ok: true,
    file: repoFileContentSchema.parse({
      ...base,
      kind: "nominal",
      content: text,
      linesLabel: `${lineCount.toLocaleString("fr-FR")} ligne${lineCount > 1 ? "s" : ""}`,
    }),
  };
}
