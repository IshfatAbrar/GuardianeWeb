// Server-side call to the deployed `chatWithAgent` Cloud Function — the only
// place its shared key is used. Never import this from client code.
//
// Contract on the function side:
//   request:  POST { messages: [{ role, content }, ...] }, header x-api-key
//   response: { reply: string }

// Kept until the function moves to gurdiane-75091 (the JoJo cutover): before
// this change an unset CLOUD_FUNCTION_URL silently meant the legacy project, and
// dropping the default now could take JoJo down in an environment that relies
// on it. It is logged so that can be found and fixed first.
const LEGACY_CLOUD_FUNCTION_URL =
  "https://us-central1-guardianeusf.cloudfunctions.net/chatWithAgent";

export function getCloudFunctionURL(env = process.env) {
  const url = env.CLOUD_FUNCTION_URL || env.NEXT_PUBLIC_CLOUD_FUNCTION_URL;
  if (url) return url;
  console.warn(
    "[ai] CLOUD_FUNCTION_URL unset — using the legacy guardianeusf function",
  );
  return LEGACY_CLOUD_FUNCTION_URL;
}

export class AgentError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Send messages to chatWithAgent and return its reply text.
 * @throws {AgentError} 500 when unconfigured, 502 when unreachable, or the
 *   upstream status when it answers with an error.
 */
export async function callChatAgent(messages, { signal } = {}) {
  const apiKey = process.env.JOJO_API_KEY;
  if (!apiKey) throw new AgentError(500, "Server is missing JOJO_API_KEY");

  const url = getCloudFunctionURL();
  let upstream;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch (err) {
    throw new AgentError(502, `Upstream request failed: ${err.message}`);
  }

  const text = await upstream.text();
  if (!upstream.ok) {
    console.error(
      `[ai] upstream ${upstream.status} from ${url}: ${text.slice(0, 500)}`,
    );
    throw new AgentError(upstream.status, "JoJo is unavailable right now.");
  }
  let reply;
  try {
    reply = JSON.parse(text)?.reply;
  } catch {
    reply = undefined;
  }
  if (typeof reply !== "string") {
    throw new AgentError(502, "Malformed response from JoJo.");
  }
  return reply;
}
