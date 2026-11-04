import "server-only";

import { mapPool } from "@/lib/async/mapPool";
import { createLogger } from "@/lib/logger";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";
const log = createLogger("gmail");
const DETAIL_CONCURRENCY = 5;

export type GmailMessageMeta = {
  id: string;
  threadId: string;
  fromRaw: string;
  subject: string;
  snippet: string;
  receivedAt: Date;
  /** IDs libellés Gmail (user + système). */
  labelIds: string[];
};

type GmailListResponse = {
  messages?: { id: string; threadId: string }[];
  nextPageToken?: string;
};

type GmailHistoryResponse = {
  history?: {
    messagesAdded?: { message: { id: string; threadId: string } }[];
  }[];
  historyId?: string;
};

type GmailMessageResponse = {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  labelIds?: string[];
  payload?: {
    headers?: { name: string; value: string }[];
  };
};

type GmailLabelsResponse = {
  labels?: { id: string; name: string; type?: string }[];
};

type GmailProfile = {
  historyId?: string;
};

async function gmailFetch<T>(
  accessToken: string,
  path: string,
): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  const response = await fetch(`${GMAIL_API}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    return { ok: false, status: response.status };
  }
  return { ok: true, data: (await response.json()) as T };
}

function headerValue(
  headers: { name: string; value: string }[] | undefined,
  name: string,
): string {
  const found = headers?.find(
    (header) => header.name.toLowerCase() === name.toLowerCase(),
  );
  return found?.value?.trim() ?? "";
}

function mapMessage(data: GmailMessageResponse): GmailMessageMeta {
  const headers = data.payload?.headers;
  const internalMs = Number(data.internalDate ?? Date.now());
  return {
    id: data.id,
    threadId: data.threadId,
    fromRaw: headerValue(headers, "From") || "(inconnu)",
    subject: headerValue(headers, "Subject"),
    snippet: data.snippet?.trim() ?? "",
    receivedAt: new Date(Number.isFinite(internalMs) ? internalMs : Date.now()),
    labelIds: data.labelIds ?? [],
  };
}

/** Map id → name des libellés du compte. */
export async function fetchGmailLabelNames(
  accessToken: string,
): Promise<Map<string, string>> {
  const result = await gmailFetch<GmailLabelsResponse>(accessToken, "/labels");
  const map = new Map<string, string>();
  if (!result.ok) {
    return map;
  }
  for (const label of result.data.labels ?? []) {
    if (label.id && label.name) {
      map.set(label.id, label.name);
    }
  }
  return map;
}

/** Profil — historyId courant. */
export async function fetchGmailProfileHistoryId(
  accessToken: string,
): Promise<string | null> {
  const result = await gmailFetch<GmailProfile>(accessToken, "/profile");
  if (!result.ok) {
    return null;
  }
  return result.data.historyId ?? null;
}

const LIST_PAGE_SIZE = 100;
const LIST_HARD_CAP = 300;

/**
 * Messages dans une requête Gmail `q` (ex. after:epoch), paginés.
 * Métadonnées seules — pas le corps.
 */
export async function listGmailMessagesByQuery(
  accessToken: string,
  query: string,
): Promise<GmailMessageMeta[]> {
  const refs: { id: string; threadId: string }[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: query,
      maxResults: String(LIST_PAGE_SIZE),
    });
    if (pageToken) {
      params.set("pageToken", pageToken);
    }
    const list = await gmailFetch<GmailListResponse>(
      accessToken,
      `/messages?${params.toString()}`,
    );
    if (!list.ok) {
      break;
    }
    for (const message of list.data.messages ?? []) {
      refs.push(message);
      if (refs.length >= LIST_HARD_CAP) {
        break;
      }
    }
    if (refs.length >= LIST_HARD_CAP) {
      log.warn("list_hard_cap", { query, cap: LIST_HARD_CAP });
      pageToken = undefined;
    } else {
      pageToken = list.data.nextPageToken;
    }
  } while (pageToken);

  const details = await mapPool(refs, DETAIL_CONCURRENCY, async (ref) => {
    const detail = await gmailFetch<GmailMessageResponse>(
      accessToken,
      `/messages/${ref.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
    );
    return detail.ok ? mapMessage(detail.data) : null;
  });
  return details.filter((item): item is GmailMessageMeta => item !== null);
}

/**
 * Relève incrémentale via history.
 * 404 historyId trop vieux → caller doit resync.
 */
export async function listGmailHistoryAdded(
  accessToken: string,
  startHistoryId: string,
): Promise<
  | { ok: true; messages: GmailMessageMeta[]; newHistoryId: string | null }
  | { ok: false; stale: boolean }
> {
  const history = await gmailFetch<GmailHistoryResponse>(
    accessToken,
    `/history?startHistoryId=${encodeURIComponent(startHistoryId)}&historyTypes=messageAdded`,
  );

  if (!history.ok) {
    return { ok: false, stale: history.status === 404 };
  }

  const ids = new Map<string, string>();
  for (const entry of history.data.history ?? []) {
    for (const added of entry.messagesAdded ?? []) {
      ids.set(added.message.id, added.message.threadId);
    }
  }

  const idList = [...ids.keys()];
  const details = await mapPool(idList, DETAIL_CONCURRENCY, async (id) => {
    const detail = await gmailFetch<GmailMessageResponse>(
      accessToken,
      `/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
    );
    return detail.ok ? mapMessage(detail.data) : null;
  });

  return {
    ok: true,
    messages: details.filter((item): item is GmailMessageMeta => item !== null),
    newHistoryId: history.data.historyId ?? null,
  };
}

/** Corps texte brut — uniquement après consentement résumé. */
export async function fetchGmailMessagePlainText(
  accessToken: string,
  messageId: string,
): Promise<string | null> {
  const detail = await gmailFetch<{
    payload?: {
      mimeType?: string;
      body?: { data?: string };
      parts?: {
        mimeType?: string;
        body?: { data?: string };
        parts?: { mimeType?: string; body?: { data?: string } }[];
      }[];
    };
  }>(accessToken, `/messages/${messageId}?format=full`);

  if (!detail.ok) {
    return null;
  }

  const text = extractPlainText(detail.data.payload);
  return text?.trim() || null;
}

function decodeBase64Url(data: string): string {
  const padded = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64").toString("utf8");
}

function extractPlainText(
  payload:
    | {
        mimeType?: string;
        body?: { data?: string };
        parts?: {
          mimeType?: string;
          body?: { data?: string };
          parts?: { mimeType?: string; body?: { data?: string } }[];
        }[];
      }
    | undefined,
): string | null {
  if (!payload) {
    return null;
  }
  if (payload.mimeType?.startsWith("text/plain") && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  for (const part of payload.parts ?? []) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      return decodeBase64Url(part.body.data);
    }
    for (const nested of part.parts ?? []) {
      if (nested.mimeType === "text/plain" && nested.body?.data) {
        return decodeBase64Url(nested.body.data);
      }
    }
  }
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  return null;
}
