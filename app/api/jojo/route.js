// Server-side proxy to the deployed `chatWithAgent` Cloud Function.
//
// Contract on the function side:
//   request:  POST { messages: [{ role: "user"|"assistant", content: string }, ...] }
//             header: x-api-key: <shared secret>
//   response: { reply: string }
//
// We proxy from the browser through this route so the API key stays server-side
// and never reaches the JS bundle.

const DEFAULT_CLOUD_FUNCTION_URL =
  "https://us-central1-guardianeusf.cloudfunctions.net/chatWithAgent";

const MAX_MESSAGE_LEN = 4000;
const MAX_HISTORY = 30;

function getCloudFunctionURL() {
  return (
    process.env.CLOUD_FUNCTION_URL ||
    process.env.NEXT_PUBLIC_CLOUD_FUNCTION_URL ||
    DEFAULT_CLOUD_FUNCTION_URL
  );
}

function sanitizeHistory(input) {
  if (!Array.isArray(input)) return [];
  return input
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string",
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LEN) }));
}

export async function POST(request) {
  const apiKey = process.env.JOJO_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Server is missing JOJO_API_KEY" },
      { status: 500 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const messages = sanitizeHistory(body?.messages);
  if (messages.length === 0) {
    return Response.json(
      { error: "No messages provided" },
      { status: 400 },
    );
  }

  let upstream;
  try {
    upstream = await fetch(getCloudFunctionURL(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ messages }),
    });
  } catch (err) {
    return Response.json(
      { error: `Upstream request failed: ${err.message}` },
      { status: 502 },
    );
  }

  const text = await upstream.text();
  if (!upstream.ok) {
    console.error(
      `[jojo proxy] upstream ${upstream.status} from ${getCloudFunctionURL()}: ${text}`,
    );
  }
  return new Response(text, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") || "application/json",
    },
  });
}
