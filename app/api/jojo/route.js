// Stub endpoint for the JoJo chatbot.
// Returns a heuristic, canned reply. Swap the body of `generateReply` with a
// call to your LLM provider (Anthropic, OpenAI, etc.) when ready.

const MAX_MESSAGE_LEN = 4000;
const MAX_HISTORY = 30;

const TOPIC_RESPONSES = [
  {
    match: /(screen[- ]?time|phone|device|tablet|tiktok|instagram|snap|youtube)/i,
    reply:
      "Screen time can feel like a constant negotiation. A few things that tend to help:\n\n• Agree on shared rules together — kids are far more likely to stick to limits they helped set.\n• Keep phones out of bedrooms at night; a charging spot in the kitchen works well.\n• Replace, don't just remove — a walk, a board game, or family dinner gives the time something to land on.\n\nWould you like to talk through a specific situation?",
  },
  {
    match: /(anxious|anxiety|worried|panic|stress|overwhelm)/i,
    reply:
      "It sounds like you're noticing real signs of stress. Things to watch for: sleep changes, withdrawing from friends, irritability, or new physical complaints like headaches.\n\nA calm, low-pressure conversation usually helps more than a direct interrogation — try sitting side by side (in a car, on a walk) rather than face to face. And if symptoms are persistent or escalating, looping in a school counselor or therapist is worth doing early, not late.",
  },
  {
    match: /(sad|depress|down|hopeless|self[- ]harm|hurt themself|hurt myself)/i,
    reply:
      "I'm glad you're paying attention to this. If your child has mentioned self-harm or hopelessness — even casually — please treat it as serious. Reach out to a mental health professional, and in a crisis call or text 988 (US Suicide & Crisis Lifeline) or your local emergency number.\n\nFor day-to-day support: listen without trying to fix, validate what they're feeling, and keep the door open. You don't have to have the right words — just being present matters more than most parents realize.",
  },
  {
    match: /(bully|cyberbully|mean (kid|girl|boy)s?|harass)/i,
    reply:
      "Bullying — especially online — can feel relentless because there's no escape from it. A few steps that help:\n\n1. Document it: screenshots of messages, posts, usernames, dates.\n2. Report through the platform and, if it involves classmates, the school.\n3. Don't have your child retaliate publicly — it often makes things worse.\n4. Make sure they know it's not their fault and they didn't cause it.\n\nDo you want help thinking through how to approach the school or platform?",
  },
  {
    match: /(school|teacher|grade|homework|class)/i,
    reply:
      "School struggles often look like behavior problems but trace back to something else — sleep, friendships, learning differences, or just feeling unseen.\n\nStart with curiosity rather than consequences: \"I noticed things have felt harder lately — what's going on for you?\" If the pattern continues for more than a couple of weeks, a check-in with the teacher or counselor can surface things you can't see from home.",
  },
  {
    match: /(sleep|tired|insomnia|bedtime)/i,
    reply:
      "Sleep is one of the highest-leverage things to protect at this age. Teens need 8–10 hours but most get far less.\n\nWhat helps:\n• Screens out of the bedroom (this one matters more than any other).\n• A consistent wind-down — same lights, same time, even on weekends.\n• No caffeine after lunch.\n\nIf they're regularly awake past midnight or can't fall asleep, that's worth raising with a pediatrician.",
  },
  {
    match: /(emergency|urgent|crisis|911|hurt|danger)/i,
    reply:
      "If you or your child is in immediate danger, please call 911 (or your local emergency number) right now.\n\nFor mental health crises in the US, you can call or text 988 — it's free, confidential, and 24/7. I can help you think through what to say or do next once you're safe.",
  },
  {
    match: /(hello|hi|hey|good (morning|afternoon|evening))/i,
    reply:
      "Hi! I'm glad you're here. I can help with questions about your child's digital well-being, mental health, school, friendships, or anything else on your mind. What would you like to talk through?",
  },
  {
    match: /(thank|thanks|appreciate)/i,
    reply:
      "Of course. Parenting is hard work, and showing up to ask questions is already a lot. I'm here whenever you need to think something through.",
  },
];

const FALLBACK_REPLIES = [
  "That's a thoughtful question. Tell me a bit more — how old is your child, and what's happening that prompted this?",
  "I want to give you something useful here. Could you share a little more context about what's been going on?",
  "Good question. The right approach usually depends on the child and the situation — what have you noticed so far?",
];

function generateReply(history) {
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  const text = lastUser?.content || "";

  for (const topic of TOPIC_RESPONSES) {
    if (topic.match.test(text)) {
      return topic.reply;
    }
  }

  const idx = Math.floor(Math.random() * FALLBACK_REPLIES.length);
  return FALLBACK_REPLIES[idx];
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
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, MAX_MESSAGE_LEN),
    }));
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const history = sanitizeHistory(body?.messages);
  if (history.length === 0) {
    return Response.json(
      { error: "No messages provided." },
      { status: 400 },
    );
  }

  // Small artificial delay so the typing indicator is visible.
  await new Promise((resolve) => setTimeout(resolve, 600));

  const reply = generateReply(history);

  return Response.json({ reply });
}
