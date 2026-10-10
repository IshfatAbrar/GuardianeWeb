# Guardiané Web — System Design

This document describes how the Guardiané parent web app is built: what runs where, how data moves, and the constraints behind the design. For setup and a screen-by-screen UI tour, see [`README.md`](README.md).

---

## 1. Context

Guardiané is a child digital-wellbeing product. Five live clients share one Firebase project, **`gurdiane-75091`**:

| Client | Stack | User | Auth |
| --- | --- | --- | --- |
| **GuardianeWeb** (this repo) | Next.js 16 / React 19 | Parent | Firebase Auth (email + password, verified email; `test@gmail.com` is exempt for testing) |
| **Guardiane_Parent_Facing** | Swift, iOS | Parent | Firebase Auth (email + password, verified email; same test exemption) |
| **GuardParent** | Expo, Android | Parent | Firebase Auth (email + password, no verification) |
| **Guardiane_Kid_Facing** | Swift, iOS | Child | Holds the child's document id from the pairing QR. Signs in **anonymously** to Firebase, used only to call the AI routes (`/api/jojo`, `/api/classify`); Firestore access stays unauthenticated |
| **Guardiane_Android** | React Native | Child | Same as iOS: child doc id from the QR, anonymous sign-in for the AI routes from the current branch on (older builds have none) |

The apps never talk to each other directly. **Firestore is the integration bus.** The child device writes signals (mood, screen time, risk alerts, lesson progress). The parent apps read those signals and write configuration back (assignments, app limits, screen-time limits, emergency contacts, chat messages).

> `guardianeusf` is a legacy project with an old camelCase schema (`families`, `children`, `enhancedDailyLogging`…). Nothing live uses it. Don't deploy rules there, and don't reintroduce its schema.

```
 ┌──────────────────────┐        ┌─────────────────────────────┐        ┌──────────────────────┐
 │  Child device app    │        │   Firebase  gurdiane-75091  │        │  Parent clients      │
 │  (no Firebase Auth)  │        │                             │        │                      │
 │                      │ write  │  Firestore (shared schema)  │ listen │  GuardianeWeb (this) │
 │  mood / screen time ─┼───────►│  users, mood_entries,       │◄───────┼─ GuardParent (Expo)  │
 │  risk alerts / SOS   │        │  screen_time_entries,       │ write  │                      │
 │  lesson progress     │◄───────┼─ messages, module_*, …      │◄───────┤  assignments, limits,│
 │  reads limits,       │  read  │                             │        │  contacts, chat      │
 │  assignments, chat   │        │  Firebase Auth (parents)    │        │                      │
 └──────────────────────┘        └─────────────────────────────┘        └──────────────────────┘
```

---

## 2. High-level architecture

```
                         Browser (parent / visitor)
 ┌──────────────────────────────────────────────────────────────────────┐
 │  Next.js App Router, almost entirely client components               │
 │                                                                      │
 │  AuthProvider ─► NotificationsProvider ─► ToastProvider ─► pages      │
 │       │                    │                                         │
 │       │ Firebase Auth SDK  │ onSnapshot + IndexedDB cache            │
 │       ▼                    ▼                                         │
 │  firebase/auth      firebase/firestore  ◄── direct reads/writes,     │
 │                                             enforced by rules        │
 │  localStorage / sessionStorage: theme, prefs, guest chat, trial      │
 └───────────────┬──────────────────────────────────────────┬───────────┘
                 │ fetch /api/*                             │ WebSocket-style
                 ▼                                          │ Firestore channel
 ┌───────────────────────────────────┐                      ▼
 │  Next.js route handlers (server)  │              ┌───────────────┐
 │  /api/jojo, /api/classify ────────┼─x-api-key───►│ chatWithAgent │ Cloud Function (LLM)
 │    caller check + daily limits    │              └───────────────┘
 │    (Firebase Admin, ai_usage)     │
 │  /api/screen-time/* ── Firebase Admin (screen_time_unlocks)
 │  /api/send-verification ─┐        │              └───────────────┘
 │  /api/forgot-password  ──┼─ Firebase Admin (mint links)
 │                          └─ Mailer (Resend | SMTP)
 │  /api/partner         ─── Resend ─► team inbox                     │
 │  instrumentation.js   ─── OpenTelemetry (@vercel/otel)             │
 └───────────────────────────────────┘
```

The design choices that matter:

- **Thick client, thin server.** All product data goes browser → Firestore through the client SDK, and **Firestore Security Rules are the only server-side authorization layer** for it. The Next.js server exists for: holding secrets (the JoJo API key, Admin credentials, mail keys), being the **only way any app reaches the AI** (it checks the caller, rate-limits and owns the prompts), the Screen Time unlock codes, sending email, and telemetry.
- **Real-time by default.** Anything the child device can change is read with `onSnapshot`, so the dashboard updates without a reload.
- **Schema parity over schema quality.** The web conforms to the schema the Android apps already use, including its quirks, because three clients share it.

---

## 3. Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Styling | Tailwind CSS 4 with CSS-variable light/dark themes (`data-theme` on `<html>`) |
| Font / icons | Epilogue (`next/font`), lucide-react, Font Awesome, Blobatar avatars |
| Client data | `firebase` v12 modular SDK (Auth + Firestore) |
| Server data | `firebase-admin` (Auth only: minting verification and reset links) |
| Email | Resend (preferred) or Nodemailer SMTP |
| AI | `chatWithAgent` Firebase Cloud Function (OpenAI gpt-4o-mini), reached only through `/api/jojo` and `/api/classify` |
| QR | `qrcode` |
| Observability | OpenTelemetry via `@vercel/otel` (service `guardiane-web`) |
| Tests | Vitest (pure logic, offline) |
| Hosting | Vercel. GitHub Actions CI mirrors the Vercel build |

---

## 4. Application structure

```
app/
├── layout.js                 Root: fonts, theme bootstrap script, providers, SiteHeader
├── page.js, guardiane/, support/     Public marketing pages
├── login/ signup/ forgot-password/   Auth screens (signup is a multi-step wizard)
├── chatbot/                  Public guest JoJo (+ lightweight lead "login"/"signup")
├── dashboard/
│   ├── page.js               Shell: Sidebar + tab switch driven by ?tab=
│   ├── _lib/                 useDashboardData, useJojoChat, useModuleCompletionAlerts
│   ├── components/           One file per tab / card / modal
│   └── data/                 Nav config, seed modules
├── context/AuthContext.js    Auth + live parent profile
├── lib/                      Data-access and domain modules (see §6)
└── api/                      Server route handlers (see §8)
components/                   Shared chrome: header, footer, AuthGuard, theme toggle…
lib/                          siteConfig, storeLinks
firestore.rules               Rules for the whole shared project
```

### Layering

```
 Pages / tab components      (presentation, local UI state)
        │
 Hooks & providers           useAuth, useDashboardData, useNotifications,
        │                    useJojoChat, useToast, usePreference
        │
 Domain + data modules       app/lib/*.js. The only code that imports
        │                    firebase/firestore. Pure helpers (mood scoring,
        │                    alert severity, screen-time aggregation) live
        │                    here too and are unit-tested
        ▼
 Firebase SDK  ──►  Firestore / Auth
```

Components don't build Firestore queries. They call functions like `listenToConversation`, `assignModule`, or `setParentAppLimit`. That keeps the shared-schema rules in one place.

### Routing and rendering

- Public pages and auth screens are ordinary routes. `AuthGuard mode="public"` redirects signed-in users to `/dashboard`.
- `/dashboard` is a single route. Tabs (`overview`, `messaging`, `chatbot`, `learning`, `modules`, `emergency`, `settings`) are selected with `?tab=` so they can be deep-linked. Unknown values fall back to `overview`.
- `AuthGuard mode="protected"` renders nothing until Firebase resolves the persisted session, so signed-out content never flashes.
- Because nearly everything is a client component, **route protection is a UX concern**. Actual data protection comes from Firestore rules (§7).

---

## 5. Identity and authentication

### Parents

1. **Sign-up** (`/signup` wizard: account, add children, device setup, done). `createUserWithEmailAndPassword`, then `provisionParent()` writes the parent doc and all child docs in **one `writeBatch`**. If the batch fails, the new Auth user is deleted so the email address isn't left squatted without a profile.
2. **Email verification.** `authHelper.sendVerificationEmail` calls `POST /api/send-verification` with the user's ID token. The server verifies the token with the Admin SDK, mints a verification link, and sends a branded email. It returns `sent`, `already`, or `firebase`, and on `firebase` the client falls back to Firebase's stock email. A 60 s per-instance cooldown limits accidental repeat sends.
3. **Session.** `browserLocalPersistence` stores the refresh token in IndexedDB, so the session survives tabs and restarts.
4. **Gate.** `AuthContext` treats an unverified user as signed out everywhere. Before deciding, it calls `user.reload()` once, because the persisted `emailVerified` flag may be stale. This gate is **client-side only**, the same as iOS. Firestore rules don't check `email_verified`.
5. **Profile.** Once verified, `AuthContext` does a one-shot `getUserProfile` for first paint, then attaches `listenToDoc('users/{uid}')` so profile changes (for example, a child added from Android) flow in live.
6. **Password reset.** `POST /api/forgot-password` is branded, with a stock fallback. It returns `sent` for unknown emails too, so the endpoint can't be used to discover which accounts exist.

### Children and device pairing

- A child is a `users` document with `role: "child"` and `parentId: <parent uid>`. **Children have no Auth account.**
- The pairing QR payload is **the child's raw document id** (`childQrPayload`). The child app runs `doc(db, 'users', scanned)` and checks `role`. Any other format is rejected.
- *Security consequence:* anyone who learns a child's doc id can pair as that child. This design comes from the Android apps, and the web mirrors it. Fixing it depends on the child apps using Auth for Firestore too, not just for the AI routes.

### Kid devices and the AI routes

- Both kid apps sign in to Firebase **anonymously** and send that ID token plus the paired `childId` to `/api/jojo` and `/api/classify`. The server accepts it only if `users/{childId}` is a `role: "child"` doc, and counts usage per child (`app/lib/aiCaller.js`).
- This proves "a real install signed in", not "this exact device paired with this child". The per-child daily limit bounds abuse; App Check would close the gap later.
- Anonymous sign-in must be **enabled** in the Firebase console for this to work.

### Guests (public `/chatbot`)

- No Firebase Auth. Chat history lives in `sessionStorage`. A free-trial counter in `localStorage` (`jojo_guest_tries_v1`, limit 1) gates further messages behind a contact form; it's a lead-capture nudge, not a security control.
- The page marks its requests `x-guardiane-client: web-guest`, so `/api/jojo` applies the guest limit (30 a day per hashed IP), and JoJo's replies go through the explicit-content check.
- The contact form writes a **lead** to `jojoLeads` (create-only, shape-validated, never client-readable) and stores a local "registered guest" flag. This isn't an account.

---

## 6. Data model (shared Firestore schema)

Conventions: **collection names are snake_case, field names are camelCase.** Documented exceptions, such as `aiInsights.mood_insight`, must stay as Android writes them.

| Collection | Written by | Read by web | Purpose / notes |
| --- | --- | --- | --- |
| `users/{id}` | Parent apps | ✔ live | Parents **and** children, split by `role`. Children link via `parentId` and are ordered by `childIndex`. Child docs also hold `parentAppLimits` (Android per-app map) and `screenTimeLimitMinutes` (iOS whole-device limit). Don't read the parent's `linkedChildren` array: GuardParent overwrites it and it drops children |
| `users/{id}/jojoConversations/*` | GuardParent | — | GuardParent's JoJo history |
| `mood_entries` | Child | ✔ live | Daily wellness check-ins (mood, energy, stress, outlook) |
| `screen_time_entries` | Child | ✔ live | Periodic syncs with an `allApps` breakdown |
| `messages` | Parent + child | ✔ live | Parent↔child chat **and** risk alerts (child-sent rows carrying a classification or the `Risk detected:` prefix) |
| `alerts` | Child | ✗ | Dual-write of risk detections. The web deliberately keeps reading `messages` |
| `emergency_contacts` | Parent | ✔ live | Scoped by `parentId`. The child app reads them |
| `modules/{id}/lessons/*` | Parent (custom) + seed | ✔ one-shot | Learning content. Rarely changes, so no standing listener |
| `module_assignments` | Parent | ✔ live | Deterministic id `assignmentKey(childId, moduleId)`, so reassigning is idempotent |
| `learning_progress` | Child | ✔ live | Completion and quiz score per child/lesson |
| `lesson_streaks`, `conversations` | Child | — | Child-app only |
| `aiInsights/{childId}` | GuardParent (Gemini) | ✔ live, **read-only** | One cached doc per child per day. The web never generates insights, to avoid a duplicate LLM call and a write race |
| `chatSessions/{id}/messages/*` | Web | ✔ live | Parent JoJo history. Sessions are created lazily on the first message. Messages are immutable, and sessions are soft-deleted |
| `jojoLeads` | Web (guest) | ✗ | Lead capture, read only from the Firebase console |
| `ai_usage/{route}_{caller}_{day}` | Web server (Admin) | ✗ | Daily AI usage counters (`{ count, expiresAt }`). No client rule, so default-deny keeps it private. Add a TTL policy on `expiresAt` to sweep old days |
| `screen_time_unlocks/{childId}` | Web server (Admin) | ✗ | One-time Screen Time unlock codes (hashed). Admin-only |

### Query and index strategy

- Most listeners use equality filters (`parentId`, `childId`, `role`, `senderType`, `isRead`) that Firestore can serve by merging single-field indexes. Ordered chat queries use composite indexes.
- **Bounded windows** on hot collections: conversations use `limitToLast(200)` (real pairs already have 700+ messages), and the app-wide alert scan reads the newest 300 per child, which is then filtered client-side down to the bell's 50-alert cap.
- **Per-child fan-out:** alert, unread-count, and progress listeners open one query per child and merge results in memory. Listeners are keyed on a sorted, joined id string, so re-emitting identical children doesn't tear them down.

---

## 7. Security model (`firestore.rules`)

The rules file is **shared by all three clients**, and it carries one hard constraint:

> **The child app is unauthenticated.** Every path the child app reads or writes must allow `request.auth == null`. Adding `request.auth` to such a path breaks the child app immediately.

Given that, the rules work in tiers:

| Tier | Paths | Policy |
| --- | --- | --- |
| Public by necessity | `mood_entries`, `screen_time_entries`, `messages`, `alerts`, `learning_progress`, `conversations`, `lesson_streaks`; reads of `modules`, `module_assignments`, `emergency_contacts`; `get` on `users` | Open, with minimal shape checks on create (`childId is string`, `senderType in [...]`). Deletes need auth where the child app doesn't delete |
| Parent-owned writes | `users` (self, or child with `parentId == uid`), `emergency_contacts`, `modules`, `module_assignments` | `request.auth` required, with ownership checks where the data carries an owner |
| Parent-private | `chatSessions` (+ messages), `aiInsights`, `users/*/jojoConversations` | Auth required. `chatSessions` is owner-only, can't be reassigned, and its messages are immutable |
| Anonymous create-only | `jojoLeads` | Strict key whitelist and length limits. Never readable |
| Everything else | `/{document=**}` | **Default deny** |

`list` on `users` requires auth, so children and parents can't be enumerated, but a single `get` by id is public. That is the same trade-off as the QR pairing design.

Rules are deployed with `firebase deploy --only firestore:rules` (`.firebaserc` points at `gurdiane-75091`). They're covered by an emulator suite in `tests/rules/` (`npm run test:rules`, needs Java 21+), which CI also runs.

---

## 8. Server endpoints

All handlers are stateless Node route handlers under `app/api/`.

| Route | Input | Does | Failure behavior |
| --- | --- | --- | --- |
| `POST /api/jojo` | `Authorization: Bearer <ID token>` (parent, or kid anonymous token + `childId`); `{ messages: [{role, content}] }` | Identifies the caller (`aiCaller.js`), charges a daily limit (`aiQuota.js`), keeps only `user`/`assistant` roles (last 30, 4000 chars each), adds `PARENT_PERSONA` for parents, then forwards to `CLOUD_FUNCTION_URL` with `x-api-key: JOJO_API_KEY`. Returns `{ reply }` | 401 bad token, 403 not a parent or paired child, 429 over the daily limit, 400 bad input, 502 upstream unreachable. Tokenless calls are `legacy` (rate-limited) until `AI_REQUIRE_AUTH=true`, then `guest` |
| `POST /api/classify` | Bearer kid token + `{ texts, childId }` | Batches of 12 through `chatWithAgent` with the server-owned classifier prompt (`aiPrompts.js`). Returns `{ labels }` aligned with `texts` | 401 without a token, 502 when every batch failed |
| `POST /api/screen-time/unlock-code` | Bearer parent token + `{ childId }` | Issues a 6-digit, 10-minute, one-use code for the child's iPhone. Only the child's own parent may ask | 401 / 403 / 503 if Admin isn't configured |
| `POST /api/screen-time/verify-unlock` | `{ childId, code }` (kid device, no auth) | Checks the salted hash; 5 wrong guesses kill the code | `{ ok:false, reason }` |
| `POST /api/send-verification` | `Authorization: Bearer <ID token>` | Verifies the token, mints a link, sends the branded email | `{delivery:"firebase"}` tells the client to use the stock email |
| `POST /api/forgot-password` | `{ email }` | Mints a reset link, sends the branded email | Same fallback. Never reveals whether the account exists |
| `POST /api/partner` | `{ name, email, organization, message }` | Trims, validates, and HTML-escapes the fields, then emails the partner inbox via Resend | 503 if Resend isn't configured |

**Graceful degradation is a design rule here.** `getMailer()` and `getAdminAuth()` return `null` when their env vars are missing, and callers fall back to Firebase's built-in emails. The app works with no mail or Admin config at all.

**Mail transport selection** (`app/lib/mailer.js`): Resend is used when `RESEND_API_KEY` and `RESEND_FROM` are set. Otherwise it's SMTP (`SMTP_USER` + `SMTP_PASS`, Gmail by default). With neither, there is no mailer.

---

## 9. Key flows

### 9.1 Dashboard load

```
AuthGuard ── wait for auth + profile ──► DashboardContent
  useDashboardData(uid)
    ├─ listenToChildrenForParent(uid)        → children, selectedChildId (reconciled every snapshot)
    ├─ fetchAllModules()                     → one-shot
    ├─ listenToAlerts(uid, childIds)         → per-child fan-out → merged feed + stats
    ├─ listenToUnreadMessageCount(...)
    ├─ listenToAssignments(uid) + listenToLearningProgressForChildren(childIds)
    └─ for selected child: mood history, latest screen time, aiInsights (all live)
```

When the children list shrinks (a child was deleted on another device), the selection falls back to the first remaining child. It never points at a missing doc.

### 9.2 Risk alert → parent

```
Child device classifier / SOS button
   └─► messages.add({ senderType:"child", metadata.classification, message:"Risk detected: …", isRead:false })
          (also dual-writes alerts/, which the web ignores)
Web: listenToAlerts ─► isAlertMessage() ─► alertSeverity()
   ├─ NotificationsProvider: L1 React state ◄─ hydrated from L2 IndexedDB (7-day TTL) for fast paint,
   │                         then replaced by L4 Firestore snapshot, mirrored back to L2
   ├─ Bell + Recent Activity + Risk Alerts page
   └─ critical ("Suicidal Reference", "SOS Emergency") ─► CriticalAlertPopup
          full-screen, repeating sound (~30 s), dedup'd via its own localStorage "seen" set;
          dismissing does NOT mark the alert read
```

Where the alerts come from on each kid app:

| Kid app | Text checked | Pipeline |
| --- | --- | --- |
| Android | Every notification the phone receives, plus what the child types in the app | Incognito + explicit-content rules on the device, then `/api/classify` |
| iOS | Only what the child types inside Guardiané (JoJo, chat with parent). iOS doesn't let apps read other apps' notifications or screens | Crisis keywords, then explicit-content rules (`VulgarContentDetector.swift`, with Android's false positives removed), then `/api/classify`. Plus SOS and Screen Time tampering |

Classification policy (`app/lib/messages.js`): missing a real alert is worse than showing a spurious one, so only the explicit `Safe/Neutral` label is excluded, and unknown labels degrade to `info`. The alert must be child-sent, so a parent typing "Risk detected:" can't forge one.

### 9.3 Parent → child configuration

| Action | Write | How the child picks it up |
| --- | --- | --- |
| Assign module | `module_assignments/{childId_moduleId}` (merge) | Child app reads assignments |
| Android per-app limit | `users/{childId}.parentAppLimits[pkg]` via `FieldPath`, because package names contain dots | Child's periodic monitoring sync takes the stricter of parent and child limits |
| iOS daily limit | `users/{childId}.screenTimeLimitMinutes` | iOS app re-reads it when the Screen Time screen opens |
| Emergency contact | `emergency_contacts` | Child app reads by `parentId` |

There is **no push channel to child devices**. Configuration changes are eventually consistent, and they land on the child's next sync.

### 9.4 JoJo chat

```
useJojoChat
  send(text) ─► optimistic local append
            ─► (first message) createChatSession(uid, title)
            ─► addChatMessage(user msg)            best-effort; failure is logged, UI keeps going
            ─► POST /api/jojo { last N messages }, Bearer ID token
                     ─► caller check + daily limit ─► PARENT_PERSONA ─► chatWithAgent ─► { reply }
            ─► append + addChatMessage(assistant msg), touchChatSession
  sessions list ◄─ listenToChatSessions(uid)
```

The guest `/chatbot` uses the same `/api/jojo` route without a token (guest limits), with history in `sessionStorage` and nothing written to Firestore apart from the optional lead.

Who gets which persona, and what's checked:

| Caller | Persona | Reply check | Daily limit |
| --- | --- | --- | --- |
| Parent (web, iOS, Android) | `PARENT_PERSONA` | none | 200 |
| Kid device (iOS, Android) | function's kid persona | explicit-content check (`app/lib/explicitContent.js`); a hit becomes a safe reply | 200 chat, 500 classify |
| Guest (`/chatbot`) | kid persona | explicit-content check | 30 per IP |
| Legacy (no token, before the cutover) | kid persona | explicit-content check | 300 per IP |

Client `system` messages are always dropped (`sanitizeHistory`), so no caller can change the prompt.

---

## 10. Client-side state and caching

| Store | Holds | Why |
| --- | --- | --- |
| React context | Auth user + profile, notifications, toasts | App-wide, live |
| IndexedDB `guardiane-notifications` v2 | Alert mirror, 7-day TTL | Instant bell on cold start. Disposable: a schema bump drops the store |
| IndexedDB (Firebase) | Auth refresh token | Persistent session |
| `localStorage` | Theme (applied by an inline `<head>` script to avoid a flash), preferences, critical-alert "seen" set (capped at 200), module-completion "unseen" counts, guest trial counter, guest lead flag | Per-browser conveniences |
| `sessionStorage` | Guest JoJo conversations | Private by default, gone when the tab closes |

There's deliberately no server cache tier (no Redis or similar). Firestore's `onSnapshot` already provides push, and there's no backend that owns product data.

---

## 11. Observability, CI, and deployment

- **Tracing:** `instrumentation.js` calls `registerOTel({ serviceName: "guardiane-web" })`, which traces route handlers, SSR, and outgoing `fetch` (including the JoJo upstream call). Spans export to a Vercel OTel integration or drain, or to `OTEL_EXPORTER_OTLP_ENDPOINT`. With neither configured, spans are dropped.
- **Logging:** Server handlers log with prefixes like `[ai]`, `[forgot-password]`, and `[send-verification]`. Every AI call logs `[ai] route=… caller=… status=…`; watch `caller=legacy` to know when old app builds are gone, and `status=502` for classifier outages (which would otherwise look like a quiet day with no alerts).
- **CI** (`.github/workflows/ci.yml`, every push and PR):
  1. `gitleaks` secret scan over the full history
  2. `npm ci`, then lint, then `prettier --check`, then `vitest run`, then `next build` (with placeholder env)
  3. `firestore-rules`: the emulator-backed rules suite (Java 21)
- **Deploy:** Vercel builds on push. Environment variables live in Vercel. Firestore rules are deployed separately with the Firebase CLI.

### Configuration

| Variable | Side | Required |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` (6) | Client | Yes. **These choose the runtime project** (`.firebaserc` only scopes the CLI) |
| `CLOUD_FUNCTION_URL`, `JOJO_API_KEY` | Server | Yes, for JoJo |
| `AI_REQUIRE_AUTH` | Server | Optional. `true` after the JoJo key cutover |
| `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` | Server | Optional (branded auth emails) |
| `RESEND_API_KEY` + `RESEND_FROM`, or `SMTP_*` | Server | Optional (branded emails) |
| `PARTNER_INBOX_EMAIL` | Server | Optional (defaults to the team inbox) |
| `NEXT_PUBLIC_SITE_URL` | Both | Optional (continue-URL in auth emails) |
| `NEXT_PUBLIC_APP_STORE_URL`, `NEXT_PUBLIC_PLAY_STORE_URL` | Client | Optional |
| `OTEL_EXPORTER_OTLP_ENDPOINT` / `_HEADERS` | Server | Optional |

---

## 12. Testing strategy

- **Unit (Vitest, offline):** pure domain logic in `app/lib/*.test.js`, covering the AI routes' caller check, daily limits, prompts and reply parsing, the explicit-content check, profile/child/QR helpers, mood scoring and ranges, message and alert classification, learning-module and question builders, emergency contacts, phone validation, screen-time aggregation, AI-insight parsing, mail config resolution, and email templates.
- **Rules:** `tests/rules/firestore.rules.test.mjs` runs against the Firestore emulator (`npm run test:rules`; CI job `firestore-rules`). It pins what each client relies on: unauthenticated child writes, parent ownership, creator-only module edits, private collections. Rule changes still need a thought about every client, but a break now fails CI.
- **Build gate:** CI runs the same `next build` as Vercel, so a green check means the deploy will build.

---

## 13. Known limitations and risks

| # | Issue | Impact | Path forward |
| --- | --- | --- | --- |
| 1 | Kid apps use no Auth for Firestore, so most child data is world-readable/writable by anyone who knows or guesses ids | Privacy exposure. Anyone can forge child-side writes | Both kid apps now sign in anonymously (for the AI routes). Once old Android builds are gone, use that sign-in for Firestore too and tighten rules path by path |
| 2 | QR payload is the bare child doc id, with no expiry | Anyone who learns the id can pair as the child | One-time pairing codes exchanged server-side for a child credential |
| 3 | Email verification is enforced only in the client | An unverified user can still hit Firestore with a valid token | Add `request.auth.token.email_verified` to parent-owned rules. **Blocked:** the Android parent app doesn't verify emails, so this would lock its parents out |
| 4 | `VERIFICATION_EXEMPT_EMAILS` test bypass (`test@gmail.com`) | Whoever registers that address first skips verification | Kept on purpose for testing; remove before launch |
| 5 | ~~`modules` writable by any authenticated user~~ | — | **Fixed:** rules now allow edits only by `createdBy`; creator-less built-in modules accept lessons and `lessonCount` bumps only (rules tests cover it) |
| 6 | JoJo key: was shipped in every kid app, with an open function on the legacy `guardianeusf` project | Free LLM proxy for anyone who extracted it | **In progress:** all clients now go through `/api/jojo` and `/api/classify` with ID tokens and daily limits. Remaining: set `AI_REQUIRE_AUTH=true`, move the function to `gurdiane-75091` with a new key, delete the old one |
| 7 | Guest trial counter lives in `localStorage` | Trivially reset | Mitigated: the server caps guests at 30 messages a day per IP. The local counter is only the lead-capture nudge |
| 8 | Per-child listener fan-out | Read cost grows with children × listeners | Acceptable at family scale. Revisit if accounts get large |
| 9 | No push to child devices | Limits and assignments take effect on the next sync | FCM to child devices, once they have an identity |
