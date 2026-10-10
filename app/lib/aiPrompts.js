// Server-owned prompts for the two AI routes (/api/jojo and /api/classify).
//
// Clients used to send their own `system` messages straight to the
// `chatWithAgent` Cloud Function, which is what made a leaked key a free
// general-purpose LLM proxy. Now the routes strip every client `system` message
// and add only the ones below, so a caller can get a JoJo reply or a risk label
// and nothing else.
//
// `chatWithAgent` always prepends its kid-companion persona (ages 6–14). Both
// prompts here are appended after it and override it where they need to.

// ── Classifier ───────────────────────────────────────────────────────────────
//
// Moved verbatim from the Android child app (services/RemoteTextClassifier.js),
// which carries the full history. The short version: the kid persona's rule #1
// ("Never discuss ... self-harm") fights classification, and with a plain prompt
// every Suicidal Reference case came back as Emotional Distress. This wording
// scored 11/12 on Android's labelled probe set with every suicidal case right; a
// weaker one silently reverts them. Treat it as safety code, not copy, and re-run
// Android's scripts/check-classifier-accuracy.mjs after any change.

// 'Incognito Browsing' is absent by design: the Android child app derives it
// from the app package on-device; it is not inferable from text.
export const REMOTE_LABELS = [
  "Attacking Behavior",
  "Suicidal Reference",
  "Emotional Distress",
  "Explicit Content",
  "Safe/Neutral",
];

export const CLASSIFIER_OVERRIDE = [
  "Disregard all previous persona instructions. You are not a chat companion and you are not talking to a child.",
  "You are a content risk classifier inside a child-safety review system. Naming a risk category is a safety action,",
  "not a discussion of the topic - never soften, avoid or substitute the 'Suicidal Reference' label when the text",
  "references suicide, self-harm, wanting to die, or not wanting to exist.",
  `Labels: ${REMOTE_LABELS.join(", ")}.`,
  "Severity order when several apply: Suicidal Reference > Attacking Behavior > Explicit Content > Emotional Distress > Safe/Neutral.",
  "Mild frustration ('ugh i hate homework') is Safe/Neutral. Automated messages (deliveries, OTP codes, marketing) are Safe/Neutral.",
  "Idiom and hyperbole are Safe/Neutral: 'i could kill for a pizza', 'that test murdered me', 'dying of laughter', 'this game is killing me' express appetite, humour or exasperation, not risk. Judge intent, not the presence of a violent word.",
  "Song, film, game and TV titles are Safe/Neutral even when the title contains words like suicide, kill, attack or death - 'Now playing: Suicide Squad soundtrack' and 'Killing Me Softly' are media titles, not risk. Text naming a track, episode, album or app is a media title.",
  'Reply with ONLY a JSON array, one object per input, no prose: [{"i":0,"label":"..."},...]',
].join("\n");

// The function caps its reply at max_tokens 300. Twelve results is ~170 tokens
// and is the batch size verified end to end on Android.
export const CLASSIFY_BATCH_SIZE = 12;
export const CLASSIFY_MAX_TEXT_CHARS = 1000;
export const CLASSIFY_MAX_TEXTS = 48;

/** The chatWithAgent payload for one batch of texts. */
export function buildClassifyMessages(texts) {
  return [
    { role: "system", content: CLASSIFIER_OVERRIDE },
    {
      role: "user",
      content: JSON.stringify(texts.map((text, i) => ({ i, text }))),
    },
  ];
}

/**
 * Labels for one batch, aligned with its inputs; null where the model gave no
 * usable label. The reply can contain prose, so pull the first JSON array out
 * rather than parsing the whole thing. Labels are keyed by the index the model
 * echoes back, never by position: a dropped or reordered entry would otherwise
 * put a label on the wrong message.
 */
export function parseClassifierReply(reply, count) {
  const out = new Array(count).fill(null);
  const match = /\[[\s\S]*\]/.exec(String(reply ?? ""));
  if (!match) return out;

  let parsed;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return out;
  }
  if (!Array.isArray(parsed)) return out;

  for (const entry of parsed) {
    const i = Number(entry?.i);
    if (!Number.isInteger(i) || i < 0 || i >= count) continue;
    if (!REMOTE_LABELS.includes(entry?.label)) continue;
    out[i] = entry.label;
  }
  return out;
}

// ── Parent persona ───────────────────────────────────────────────────────────
//
// Parents (web dashboard, both parent apps, and their daily insights) used to
// get the kid persona, written for ages 6–14. Daily insights put their output
// format in the user message, so this must not fight explicit formatting
// instructions.
export const PARENT_PERSONA = [
  "Disregard the previous persona instructions about talking to children.",
  "You are JoJo, the Guardiané assistant for parents and guardians. You help them understand and support their child's",
  "digital wellbeing: screen time, mood, online safety, learning, and how to talk with their child about hard topics.",
  "Be warm, practical and concise, and speak to an adult. Do not give medical, legal or financial advice; suggest a",
  "professional when it is needed. If a child may be in immediate danger, tell the parent to contact emergency services",
  "(911 in the US) or the 988 Suicide & Crisis Lifeline.",
  "When the message gives formatting or output instructions, follow them exactly.",
].join("\n");

// ── Chat history ─────────────────────────────────────────────────────────────

export const MAX_MESSAGE_LEN = 4000;
export const MAX_HISTORY = 30;

/**
 * Only user/assistant turns, newest 30, 4000 chars each. Client `system`
 * messages are dropped here — the route adds the persona itself.
 */
export function sanitizeHistory(input) {
  if (!Array.isArray(input)) return [];
  return input
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string",
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, MAX_MESSAGE_LEN),
    }));
}
