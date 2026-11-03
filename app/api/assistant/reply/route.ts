import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseMail } from "@/adapters/supabase/createSupabaseMail";
import { buildAssistantReply } from "@/features/assistant/services/buildAssistantReply";
import { createLogger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const log = createLogger("assistant.reply.route");

const bodySchema = z.object({
  text: z.string().trim().min(1).max(4_000),
});

/**
 * Réponse assistant — intents déterministes (mail + GitHub), sans LLM.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const mail = createSupabaseMail(supabase);
    log.info("request", { chars: parsed.data.text.length });
    const reply = await buildAssistantReply(parsed.data.text, mail);
    log.info("response_ok", { chars: reply.length });
    return NextResponse.json({ ok: true, reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    log.error("reply_failed", { message: message.slice(0, 400) });
    return NextResponse.json({ error: "reply_failed" }, { status: 500 });
  }
}
