// Rule-based explicit-content check for JoJo's replies to children.
//
// Adapted from the Android child app's services/VulgarContentDetector.js (same
// normalisation, term lists and scoring), minus rules that flagged everyday
// kid text: "hard", "photos/pics", "on top", "balls", "doggy" alone,
// "missionary", "climax", "escort", "lube", "breeding", "hook up", "edging",
// "fingering", "turned on", "bent over", "from behind", "night stand",
// "eat out", "in bed with", "sleep with me", "fill me up", "sexist", "moan".
// The iOS kid app's VulgarContentDetector.swift carries the same divergences.
//
// /api/jojo runs it on replies to kid devices and guests: the chatWithAgent
// persona already refuses adult topics, so a hit here means the model slipped
// and the reply is swapped for a safe one.

const EXPLICIT_CONTENT_LABEL = "Explicit Content";

const LEET_MAP = {
  0: "o",
  1: "i",
  3: "e",
  4: "a",
  5: "s",
  7: "t",
  "@": "a",
  $: "s",
  "!": "i",
};

/**
 * Single-hit sexual / explicit terms (word or phrase after normalize).
 * Stems ending with * match as prefixes (masturbat* → masturbation).
 */
const HARD_TERMS = [
  // core
  "sex",
  "sexy",
  "sexual",
  "sexually",
  "sexuality",
  "sexed",
  "sexing",
  // fuck family
  "fuck",
  "fucker",
  "fucking",
  "fucked",
  "fucks",
  "fuckboy",
  "fuckgirl",
  "fucktoy",
  "fuckbuddy",
  "motherfucker",
  "motherfuck",
  "mfker",
  // oral / acts
  "blowjob",
  "blow job",
  "bj",
  "handjob",
  "hand job",
  "rimjob",
  "rim job",
  "deepthroat",
  "deep throat",
  "facefuck",
  "titfuck",
  "cumshot",
  "cumming",
  "creampie",
  "cream pie",
  "squirting",
  "orgasm",
  "orgasms",
  "masturbat*",
  "jerk off",
  "jerking off",
  "jack off",
  "jacking off",
  // positions / kink slang
  "doggy style",
  "doggystyle",
  "reverse cowgirl",
  "sixty nine",
  "69ing",
  "threesome",
  "foursome",
  "gangbang",
  "gang bang",
  "orgy",
  "bdsm",
  "bondage",
  "dominatrix",
  "femdom",
  "spank me",
  "choke me",
  "raw dog",
  "rawdog",
  "bareback",
  // body / genitals
  "pussy",
  "vagina",
  "penis",
  "cock",
  "dick",
  "testicles",
  "boobs",
  "tits",
  "titties",
  "nipples",
  "asshole",
  "butthole",
  "anus",
  "clit",
  "clitoris",
  // soliciting / nudes
  "nude",
  "nudes",
  "nudity",
  "naked",
  "send nudes",
  "send nude",
  "dick pic",
  "dickpic",
  "cock pic",
  "cockpic",
  "no panties",
  "without panties",
  "netflix and chill",
  "friends with benefits",
  "fwb",
  "one night stand",
  "down to fuck",
  "dtf",
  "wanna fuck",
  "want to fuck",
  "lets fuck",
  "let's fuck",
  "fuck me",
  "fuck you",
  "suck me",
  "suck my",
  "eat me out",
  "go down on",
  // porn / platforms
  "porn",
  "porno",
  "pornography",
  "pornhub",
  "xvideos",
  "xnxx",
  "xhamster",
  "onlyfans",
  "only fans",
  "fansly",
  "hentai",
  "xxx",
  "nsfw",
  "18+",
  "adult video",
  "adult content",
  "adult film",
  "explicit video",
  "explicit content",
  "camgirl",
  "camboy",
  "cam girl",
  "sex tape",
  "sextape",
  "sexchat",
  "sex chat",
  "sex cam",
  "sexcam",
  "sex toy",
  "sextoy",
  "sex sounds",
  "sex sound",
  "moaning",
  "erotic",
  "erotica",
  "stripper",
  "strip club",
  "lap dance",
  "brothel",
  "prostitute",
  "prostitut*",
  "whore",
  "slut",
  "slutty",
  "thot",
  "milf",
  "dilf",
  "gilf",
  "sugar daddy",
  "sugar baby",
  // toys / misc
  "dildo",
  "vibrator",
  "fleshlight",
  "butt plug",
  "buttplug",
  "condom",
  "horny",
  "horni*",
  "aroused",
  "making out",
  "heavy petting",
  "foreplay",
  "intercourse",
  "penetrat*",
  "ejaculat*",
  "semen",
  "sperm",
  "wet dream",
  "blue balls",
  "pegging",
  "finger me",
  "ride me",
  "ride you",
];

/** Milder non-sexual swears — need 2+ hits (or 1 if combined with a hint pattern). */
const SOFT_TERMS = [
  "shit",
  "bitch",
  "bastard",
  "damn",
  "crap",
  "ass",
  "piss",
  "wtf",
  "stfu",
];

/**
 * Regex patterns run on normalized text (already lowercased / unmasked).
 */
const HARD_PATTERNS = [
  // fuck masks that may survive normalize
  /\bf+u*c+k+\b/,
  /\bf+[^a-z0-9]{0,3}u+[^a-z0-9]{0,3}c+[^a-z0-9]{0,3}k+\b/,
  /\bfck+\b/,
  /\bfuk+\b/,
  /\bfuq\b/,
  /\bfuq+k*\b/,
  // sex / sexual
  /\bsex(y|ual|ually|ing|ed|iness)?\b/,
  /\bs+[^a-z0-9]{0,3}e+[^a-z0-9]{0,3}x+\b/,
  /\bsex\s+\w+/, // sex sounds, sex music, sex tips, etc.
  /\w+\s+sex\b/,
  // oral / slang
  /\b(blow|hand|rim)\s*jobs?\b/,
  /\bb\.?j\.?\b/,
  /\bgiving head\b/,
  /\beat(ing)?\s+(her|him|me|you)\s+out\b/,
  // positions / acts
  /\bdoggystyles?\b/,
  /\bdoggy\s*style\b/,
  // "69" alone matches battery "69%" — require sexual context only
  /\b69ing\b/,
  /\bdoing\s+69\b/,
  /\b69\s+(sex|position|pose)\b/,
  /\bsixty[\s-]*nine\b/,
  // nudes / solicit
  /\bsend\s*(me\s*)?(nudes?|naked\s+(pics?|photos?|vids?|videos?))\b/,
  /\b(dick|cock|tit|boob)s?\s*pics?\b/,
  /\b(wanna|want to|down to|lets|let's)\s+fuck\b/,
  /\bfuck\s+(me|you|her|him|hard|tonight)\b/,
  // porn / adult
  /\b(watch|free|best|hot)\s+(porn|xxx|hentai|onlyfans)\b/,
  /\bonly\s*fans\b/,
  /\b18\s*\+\b/,
  /\bxxx\b/,
  /\bnsfw\b/,
  /\b(porn|hentai|xxx)\w*\b/,
  /\bexplicit\s+(content|video|photo|pic|audio|sound)\b/,
  /\badult\s+(content|video|site|only|film|audio|sound)\b/,
  /\b(sex|erotic|moaning)\s+(sounds?|audio|asmr|music|song|track)\b/,
  /\b(moaning|orgasm|sex)\s+(sounds?|asmr)\b/,
  // body slang
  /\b(puss(y|ies)|dicks?|cocks?|boobs?|titt(y|ies)|vaginas?|penis(es)?)\b/,
  // hints / euphemisms
  /\bnetflix and chill\b/,
  /\bfriends with benefits\b/,
  /\bone\s*night\s*stand\b/,
  /\b(get|getting)\s+laid\b/,
  /\bmake\s+love\b/,
  /\b(show|sending|sent)\s+(me\s+)?(your\s+)?(body|boobs|tits|ass|nudes?)\b/,
  /\b(take|taking)\s+off\s+(your|my)\s+(clothes|shirt|pants|bra|panties)\b/,
  /\b(no|without)\s+(pants|panties|underwear)\b/,
  /\b(boner|erection)\b/,
  /\b(wet|soaked)\s+(pussy|for you)\b/,
  /\bcome\s+inside\s+(me|you)\b/,
];

const SOFT_SCORE_THRESHOLD = 2;

function escapeRegex(term) {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Normalize text for matching: lowercase, leetspeak, masks, spaced letters.
 *
 * Important: do NOT collapse normal spaces between words. Turning
 * "Sex Sounds Lil Tjay" into "sexsoundsliltjay" breaks \bsex\b / phrase
 * matches and lets media titles slip through as Safe via the AI fallback.
 */
export function normalizeForVulgarDetection(text) {
  let t = String(text || "").toLowerCase();

  // strip zero-width / fancy chars
  t = t.replace(/[\u200b-\u200d\ufeff]/g, "");
  // bullets / middots common in media notifications ("Song • Artist")
  t = t.replace(/[•·∙⋅]/g, " ");
  t = t.replace(/[013457@$!]/g, (ch) => LEET_MAP[ch] || ch);

  // remove quote-style masks: f""ck, f''ck
  t = t.replace(/["'`“”‘’]/g, "");

  // Collapse non-space separators between letters: f*ck, f_u_c_k, f-u-c-k
  t = t.replace(/([a-z])(?:[*._\-~^|#]+)(?=[a-z])/g, "$1");

  // Collapse spaced-out single letters only: "s e x", "f u c k" (2+ letters)
  // Leave normal multi-letter words intact ("sex sounds").
  t = t.replace(/\b(?:[a-z](?:\s+[a-z]){1,12})\b/g, (m) =>
    m.replace(/\s+/g, ""),
  );

  // explicit reconstructions for leftover masks
  t = t.replace(/\bf+[^a-z]{0,4}u+[^a-z]{0,4}c+[^a-z]{0,4}k+\b/g, "fuck");
  t = t.replace(/\bs+[^a-z]{0,4}e+[^a-z]{0,4}x+\b/g, "sex");
  t = t.replace(/\bp+[^a-z]{0,4}o+[^a-z]{0,4}r+[^a-z]{0,4}n+\b/g, "porn");

  // collapse long repeats but keep xx / xxx distinguishable via patterns
  t = t.replace(/([a-z])\1{3,}/g, "$1$1");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

// The term lists are static, so every compiled pattern is reusable. Without
// this cache countTermHits() recompiled several hundred RegExps for every
// message classified - and classification runs per notification, per sync.
const termPatternCache = new Map();

function termToPattern(term) {
  const cached = termPatternCache.get(term);
  if (cached !== undefined) return cached;

  const normalizedTerm = normalizeForVulgarDetection(term.replace(/\*$/, ""));
  let pattern = null;
  if (normalizedTerm) {
    const escaped = escapeRegex(normalizedTerm);
    if (normalizedTerm.includes(" ")) {
      pattern = new RegExp(escaped, "i");
    } else if (term.endsWith("*")) {
      pattern = new RegExp(`\\b${escaped}[a-z]*\\b`, "i");
    } else {
      pattern = new RegExp(`\\b${escaped}\\b`, "i");
    }
  }

  termPatternCache.set(term, pattern);
  return pattern;
}

function countTermHits(normalized, terms) {
  const hits = [];
  for (const term of terms) {
    const pattern = termToPattern(term);
    if (pattern && pattern.test(normalized)) {
      hits.push(term.replace(/\*$/, ""));
    }
  }
  return hits;
}

function matchPatterns(normalized, patterns) {
  const hits = [];
  for (const pattern of patterns) {
    if (pattern.test(normalized)) {
      hits.push(pattern.source);
    }
  }
  return hits;
}

/**
 * Skip bank/OTP style notifications that can contain unrelated keywords.
 */
function isLikelyTransactionalNotification(text) {
  const t = String(text || "").toLowerCase();
  return (
    /\bzelle\b/.test(t) ||
    /\bvenmo\b/.test(t) ||
    /\bpaypal\b/.test(t) ||
    /\bverification code\b/.test(t) ||
    /\bone-?time (code|password|passcode)\b/.test(t) ||
    /\byour otp\b/.test(t) ||
    /\bauth(entication)? code\b/.test(t) ||
    /\btransaction\b/.test(t) ||
    /\bauto-?pay\b/.test(t)
  );
}

/**
 * @returns {null | { label: string, confidence: number, method: string, matches: string[] }}
 */
export function detectVulgarContent(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  if (isLikelyTransactionalNotification(raw)) return null;

  const normalized = normalizeForVulgarDetection(raw);
  if (!normalized) return null;

  const hardHits = [
    ...countTermHits(normalized, HARD_TERMS),
    ...matchPatterns(normalized, HARD_PATTERNS),
  ];
  if (hardHits.length > 0) {
    return {
      label: EXPLICIT_CONTENT_LABEL,
      confidence: 1,
      method: "rule_based",
      matches: [...new Set(hardHits)].slice(0, 8),
    };
  }

  const softHits = countTermHits(normalized, SOFT_TERMS);
  if (softHits.length >= SOFT_SCORE_THRESHOLD) {
    return {
      label: EXPLICIT_CONTENT_LABEL,
      confidence: Math.min(0.95, 0.55 + softHits.length * 0.15),
      method: "rule_based",
      matches: [...new Set(softHits)].slice(0, 8),
    };
  }

  return null;
}
