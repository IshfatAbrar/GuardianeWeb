// POST /api/jojo — JoJo chat for every client.
//
//   Authorization: Bearer <Firebase ID token>   (parents; kid apps' anonymous token)
//   body: { messages: [{ role: "user"|"assistant", content }], childId? }
//   → { reply }
//   → 401 bad token · 403 not a parent / not a paired child · 429 daily limit
//
// Callers: the web dashboard and guest /chatbot, both parent apps (chat and
// daily insights) and both kid apps. Only this server holds the chatWithAgent
// key (app/lib/chatAgent.js), and it picks the persona: kids and guests keep
// the function's built-in kid persona, parents get PARENT_PERSONA. Replies to
// anyone but a parent go through an explicit-content check. Client
// `system` messages are always dropped. See app/lib/aiCaller.js for who may
// call and how much.

import { trace } from "@opentelemetry/api";
import { authorizeAiRequest } from "../../lib/aiCaller";
import { consumeQuota } from "../../lib/aiQuota";
import { PARENT_PERSONA, sanitizeHistory } from "../../lib/aiPrompts";
import { AgentError, callChatAgent } from "../../lib/chatAgent";
import { detectVulgarContent } from "../../lib/explicitContent";
import { getAdminFirestore } from "../../lib/firebaseAdmin";

// Swapped in when a reply to a child or guest trips the explicit-content
// check. Same wording the kid persona uses to decline adult topics.
const SAFE_REPLY =
  "That's not something I can help with, but I'd love to chat about something fun!";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const messages = sanitizeHistory(body?.messages);
  if (messages.length === 0) {
    return Response.json({ error: "No messages provided" }, { status: 400 });
  }

  const db = getAdminFirestore();
  const { caller, response } = await authorizeAiRequest(request, "jojo", body, {
    consume: (q) => consumeQuota(db, q),
  });
  if (response) return response;

  trace.getActiveSpan()?.setAttributes({
    "ai.route": "jojo",
    "ai.caller": caller.kind,
    "ai.history_length": messages.length,
  });

  const upstreamMessages =
    caller.kind === "parent"
      ? [{ role: "system", content: PARENT_PERSONA }, ...messages]
      : messages;

  try {
    let reply = await callChatAgent(upstreamMessages);
    // Parents get adult answers; everyone else is (or may be) a child. The
    // persona should never produce explicit text, so a hit means it slipped.
    if (caller.kind !== "parent" && detectVulgarContent(reply)) {
      console.warn(`[ai] route=jojo caller=${caller.kind} reply filtered`);
      reply = SAFE_REPLY;
    }
    console.log(`[ai] route=jojo caller=${caller.kind} status=200`);
    return Response.json({ reply });
  } catch (e) {
    const status = e instanceof AgentError ? e.status : 502;
    console.error(
      `[ai] route=jojo caller=${caller.kind} status=${status}: ${e.message}`,
    );
    return Response.json({ error: e.message }, { status });
  }
}
