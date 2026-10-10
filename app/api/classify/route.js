// POST /api/classify — risk labels for a child's text, for the kid apps.
//
//   Authorization: Bearer <Firebase ID token>   (kid apps' anonymous token)
//   body: { texts: string[], childId }          (≤ 48 texts, ≤ 1000 chars each)
//   → { labels: (string|null)[] }               aligned with `texts`
//   → 401 / 403 / 429 as /api/jojo · 502 when no batch could be classified
//
// Labels are REMOTE_LABELS (app/lib/aiPrompts.js) or null where the model gave
// nothing usable; the kid apps treat null as "not classified yet" and retry on
// their next sync. The classifier prompt lives only here now — it used to be
// sent by each kid app, which is what let anyone holding the key send any
// prompt at all.

import { trace } from "@opentelemetry/api";
import { authorizeAiRequest } from "../../lib/aiCaller";
import { consumeQuota } from "../../lib/aiQuota";
import {
  buildClassifyMessages,
  CLASSIFY_BATCH_SIZE,
  CLASSIFY_MAX_TEXT_CHARS,
  CLASSIFY_MAX_TEXTS,
  parseClassifierReply,
} from "../../lib/aiPrompts";
import { callChatAgent } from "../../lib/chatAgent";
import { getAdminFirestore } from "../../lib/firebaseAdmin";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const texts = body?.texts;
  if (
    !Array.isArray(texts) ||
    texts.length === 0 ||
    texts.length > CLASSIFY_MAX_TEXTS ||
    !texts.every((t) => typeof t === "string")
  ) {
    return Response.json(
      { error: `texts must be 1–${CLASSIFY_MAX_TEXTS} strings` },
      { status: 400 },
    );
  }

  const db = getAdminFirestore();
  const { caller, response } = await authorizeAiRequest(
    request,
    "classify",
    body,
    { consume: (q) => consumeQuota(db, q) },
  );
  if (response) return response;

  const trimmed = texts.map((t) => t.trim().slice(0, CLASSIFY_MAX_TEXT_CHARS));
  const labels = [];
  let failedBatches = 0;
  for (let start = 0; start < trimmed.length; start += CLASSIFY_BATCH_SIZE) {
    const batch = trimmed.slice(start, start + CLASSIFY_BATCH_SIZE);
    try {
      const reply = await callChatAgent(buildClassifyMessages(batch));
      labels.push(...parseClassifierReply(reply, batch.length));
    } catch (e) {
      failedBatches += 1;
      console.error(`[ai] route=classify batch failed: ${e.message}`);
      labels.push(...batch.map(() => null));
    }
  }

  const batches = Math.ceil(trimmed.length / CLASSIFY_BATCH_SIZE);
  trace.getActiveSpan()?.setAttributes({
    "ai.route": "classify",
    "ai.caller": caller.kind,
    "ai.texts": trimmed.length,
    "ai.failed_batches": failedBatches,
  });

  // Every batch failing is an outage, and the kid apps back off on an error
  // status. Say so instead of answering 200 with all-null labels, which would
  // look like a quiet day rather than a broken classifier.
  if (failedBatches === batches) {
    console.error(
      `[ai] route=classify caller=${caller.kind} status=502 (all batches failed)`,
    );
    return Response.json(
      { error: "Classification is unavailable right now." },
      { status: 502 },
    );
  }
  console.log(
    `[ai] route=classify caller=${caller.kind} status=200 texts=${trimmed.length} failedBatches=${failedBatches}`,
  );
  return Response.json({ labels });
}
