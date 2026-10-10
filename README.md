# Guardiané — Parent Web App

Web application built with Next.js (App Router) that gives parents real-time visibility into their child's digital wellbeing, safety alerts, and learning progress — all in one place, in the browser.

Part of a two-app suite. The companion Kid App runs on the child's device and feeds data into this app via Firebase. This web app is the browser counterpart of the Guardiané iOS parent app and reads from the same shared Firestore.

## Features

| Area | What it does |
| --- | --- |
| Dashboard | Live overview of each child's mood, screen time, learning progress, and recent activity |
| Mood Tracking | Visual analytics (weekly timeline, distribution bars, donut chart, summary card) built from child-logged daily mood entries |
| Learning Hub | Browse, assign, and track educational modules per child; parents can create custom modules with lessons and quiz questions |
| Module Assignments | Assign built-in or custom modules to a child with a due date, and track completion status and quiz scores |
| Messaging | In-app parent ↔ child chat channel, backed by Firestore |
| Emergency | Emergency contacts and one-tap emergency call flow |
| AI Assistant (JoJo) | In-app chat for parent guidance, powered by a Firebase Cloud Function |
| JoJo Chatbot (public) | A login-free, guest version of JoJo at `/chatbot` with a free-trial gate and lightweight lead capture |
| Settings | Profile, dark mode, manage children (with QR pairing codes), and account management |
| Onboarding | Child profile creation with QR code generation for device pairing |

## App UI Overview

This section is a screen-by-screen walkthrough for anyone joining the project cold.

### Public site (logged-out)

| Route | What the visitor sees |
| --- | --- |
| `/` | Product landing page — mission, features, the USF research team, and "Partner with us" CTA. |
| `/support` | Support / help page. |
| `/chatbot` | Public, login-free JoJo assistant (see JoJo below). |

### Auth flow

| Route | What the parent sees |
| --- | --- |
| `/signup` | Full name, email, password. Password rules enforced client-side. |
| `/login` | Email + password + "Forgot password" link. |
| `/forgot-password` | Firebase password-reset request. |

Auth state is owned by `AuthContext`; protected routes are wrapped in `AuthGuard`, which redirects unauthenticated visitors to `/login`.

### Navigation — Parent Dashboard

The dashboard (`/dashboard`) uses a collapsible **side navigation** (`Sidebar`), not a top tab bar.

- A **child selector** at the top of the sidebar switches the active child for every screen.
- Each child row exposes a **QR code** button that shows the pairing payload the kid app scans.
- The active tab is reflected in the URL as `?tab=…`, so screens are deep-linkable.

Sections reachable from the side nav:

| Section (`?tab=`) | What it is |
| --- | --- |
| Home (`overview`) | Home screen |
| Messages (`messaging`) | Parent ↔ child chat |
| Learning Hub (`learning`) | Browse + manage modules |
| Module Assignments (`modules`) | Assign modules to children |
| Emergency (`emergency`) | Emergency contacts + call flow |
| JoJo Chatbot (`chatbot`) | Parent-facing JoJo assistant |
| Settings (`settings`) | Account + preferences |

### Dashboard (Home)

The main screen after login. Shows a live overview for the selected child:

- **Greeting** with the parent's first name.
- **JoJo banner** — a shortcut into the assistant.
- **Stats grid** — children count, active alerts, completed and in-progress assignments.
- **Today's Mood card** — the child's most recent daily wellness check-in (mood, energy, stress, outlook); opens a full **Mood Analytics** modal.
- **Screen Time card** — the latest screen-time entry for the child.
- **Quick Actions** — add child, open reports, jump to messages, place an emergency call.
- **Learning Modules carousel** and a **Recent Activity** feed.

### Learning Hub & Module Assignments

- **Learning Hub** — browse pre-built and custom modules. A multi-step **Create Module** flow (title → description → category → lessons → quiz questions) publishes new modules.
- **Module Assignments** — assign any module to a child with an optional due date, and track status (Not Started / In Progress / Completed) plus the quiz score once the child finishes.

### Messaging & Emergency

- **Messaging** — a live parent ↔ child chat channel backed by Firestore.
- **Emergency** — manage emergency contacts and trigger a confirmation-gated emergency call.

### Settings

Profile (display name), dark-mode toggle, manage children (add/remove, regenerate pairing QR codes), and account management, including delete-account.

### JoJo AI Chat

There are **two** JoJo surfaces on the web, both backed by the same Cloud Function through `/api/jojo`:

- **Dashboard tab** (`/dashboard?tab=chatbot`) — for the signed-in parent. Conversation history is persisted **in Firestore** (`chatSessions/{id}` + a `messages` subcollection, scoped to the user).
- **Public chatbot** (`/chatbot`, with `/chatbot/login` and `/chatbot/signup`) — a login-free guest experience. History lives in `sessionStorage` (no Firestore); a free-trial counter in `localStorage` gates further messages behind a lightweight contact-capture form.

## How the JoJo backend works

JoJo's replies do **not** come from a bespoke Firestore document — the web app reuses the **same deployed `chatWithAgent` Cloud Function** that powers the mobile app's JoJo.

```
Browser ──POST /api/jojo──► Next.js route handler ──x-api-key──► chatWithAgent Cloud Function
  { messages: [...] }         (server-side proxy)                  { reply: "..." }
```

- `app/api/jojo/route.js` is the only way any client reaches JoJo — the web app, both parent apps and both kid apps — so the shared `JOJO_API_KEY` never ships in an app or the JS bundle. It identifies the caller (parent ID token, kid anonymous ID token + `childId`, or tokenless guest — `app/lib/aiCaller.js`), charges a daily limit (`app/lib/aiQuota.js`, Admin-only `ai_usage` collection), drops client `system` messages, picks the persona (kid persona for kids and guests, `PARENT_PERSONA` for parents) and forwards to `CLOUD_FUNCTION_URL`.
- `app/api/classify/route.js` labels kid-app text for risk alerts. The classifier prompt lives only on the server (`app/lib/aiPrompts.js`); kid apps send `{ texts, childId }` and get `{ labels }`.
- `AI_REQUIRE_AUTH`: leave unset during the rollout so app builds that predate the token still work (as rate-limited `legacy` callers, logged as `[ai] … caller=legacy`). Set it to `true` once those logs go quiet; tokenless callers then get the strict `guest` limit.
- Only the chat **history** touches Firebase, and only for signed-in parents (the Firestore `chatSessions` collection). Guests never write to Firestore.

## How the Apps Are Linked

Pairing happens once via QR code (the child's document id is the pairing payload). After that, all communication is through the shared Firestore — neither app talks directly to the other. The web app subscribes with Firestore `onSnapshot` listeners so changes the child makes appear within seconds.

```
Kid app (child's phone)             Shared Firebase (Firestore)          Parent apps (web / iOS / Android)
─────────────────────────────       ──────────────────────────           ─────────────────────────────
QR scan → stores child doc id       users/{childId} (role: "child")     ◄── listenToChildrenForParent()
Mood check-in ─────────────────►    mood_entries                        ◄── mood card + report
Screen time (Android sync) ────►    screen_time_entries                 ◄── screen-time report
Screen Time status (iOS) ──────►    users/{childId}.screenTimeStatus    ◄── device section
Risk alert / SOS ──────────────►    messages (senderType "child")       ◄── bell, Risk Alerts, critical popup
Parent assigns module ─────────►    module_assignments                  ◄── kid app reads assignment
Child completes lesson ────────►    learning_progress                   ◄── parent sees completion %
Parent ↔ child messages ───────►    messages                            ◄── live messaging tab
Parent JoJo history ───────────►    chatSessions/{id}/messages          ◄── dashboard JoJo tab
```

The kid apps never call the AI directly: JoJo chat goes to `/api/jojo` and risk classification to `/api/classify`, both on this server (see above).

## Architecture

- **Framework**: Next.js 16 (App Router), React 19
- **Styling**: Tailwind CSS 4, with a light/dark theme driven by CSS variables and a `ThemeToggle`
- **Backend**: Firebase (Auth, Firestore) via the modular `firebase` v12 SDK
- **Real-time**: Firestore `onSnapshot` listeners (`listenToDoc`, `listenToChatSessions`, …)
- **AI**: `/api/jojo` and `/api/classify` server routes (caller check, daily limits, server-owned prompts, reply check for kids) → deployed `chatWithAgent` Cloud Function
- **Screen Time unlock**: `/api/screen-time/*` → Firebase Admin (one-time codes)
- **Transactional email**: `/api/partner` → Resend (the "Partner with us" form)
- **QR pairing**: `qrcode` for generating child pairing codes

## Project Structure

```text
GuardianeWeb/
├── app/
│   ├── page.js                 # Public landing page
│   ├── layout.js               # Root layout + globals
│   ├── login/ signup/ forgot-password/   # Auth screens
│   ├── support/ guardiane/     # Public content pages
│   ├── context/AuthContext.js  # Firebase auth state
│   ├── dashboard/
│   │   ├── page.js             # Dashboard shell + tab routing
│   │   ├── _lib/               # useDashboardData, useJojoChat hooks
│   │   ├── components/         # sidebar, overview, learning, modules,
│   │   │                       #   messaging, emergency, settings, jojo-chat-tab, mood/…
│   │   └── data/               # nav + module seed data
│   ├── chatbot/                # Public guest JoJo (page, login, signup, components, lib)
│   ├── api/
│   │   ├── jojo/route.js       # Proxy to the chatWithAgent Cloud Function
│   │   └── partner/route.js    # Resend-backed partner form
│   └── lib/                    # firebase, database, mood, messages, learningModules,
│                               #   emergencyContacts, jojoChat, jojoHistory, preferences…
├── components/                 # Shared UI (site-header/footer, auth-guard, theme-toggle,
│                               #   notification-panel, password-input, modals)
├── lib/                        # siteConfig, storeLinks
├── public/                     # Static assets
└── firestore.rules             # Firestore security rules
```

## Getting Started

### Requirements

- Node.js 18+ (Next.js 16)
- A Firebase project (Auth + Firestore enabled)
- Access to the deployed `chatWithAgent` Cloud Function + its API key (for JoJo)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local` in the project root:

```bash
# Firebase (client) — the runtime project is set HERE, not by .firebaserc
NEXT_PUBLIC_FIREBASE_API_KEY=…
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=…
NEXT_PUBLIC_FIREBASE_PROJECT_ID=…
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=…
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=…
NEXT_PUBLIC_FIREBASE_APP_ID=…

# JoJo assistant (server-side only — never exposed to the bundle)
CLOUD_FUNCTION_URL=…            # chatWithAgent endpoint
JOJO_API_KEY=…                  # shared secret sent as x-api-key
AI_REQUIRE_AUTH=                # "true" after the JoJo key cutover (see above)

# Optional — "Partner with us" email (Resend)
RESEND_API_KEY=…
RESEND_FROM=…
PARTNER_INBOX_EMAIL=…

# Optional — app-store CTA links (fall back to lib/storeLinks.js)
NEXT_PUBLIC_APP_STORE_URL=…
NEXT_PUBLIC_PLAY_STORE_URL=…
```

### 3. Start the development server

```bash
npm run dev
```

Then open http://localhost:3000.

## Available Scripts

- `npm run dev` — start the local development server
- `npm run build` — create a production build
- `npm run start` — run the production server
- `npm run lint` — run ESLint
- `npm run test` — run the Vitest suite
- `npm run test:rules` — run the Firestore rules tests against the emulator (needs Java 21+ and the Firebase CLI)

## Testing

The suite runs fully offline (Vitest) — no Firebase connection required.

| Test file | Coverage |
| --- | --- |
| `app/lib/database.test.js` | Profile / child / QR helpers, age calculation |
| `app/lib/mood.test.js` | Mood entry parsing and range queries |
| `app/lib/messages.test.js` | Messaging helpers |
| `app/lib/learningModules.test.js` | Module + lesson model |
| `app/lib/emergencyContacts.test.js` | Emergency contact model |
| `app/lib/aiCaller.test.js` | Who may call the AI routes (parent, kid device, guest, legacy) |
| `app/lib/aiQuota.test.js` | Daily AI limits (stops at the cap, fails open) |
| `app/lib/aiPrompts.test.js` | Classifier prompt, reply parsing, client prompts dropped |
| `app/lib/explicitContent.test.js` | JoJo reply check for kids (catches explicit text, ignores everyday words) |
| `tests/rules/firestore.rules.test.mjs` | Firestore rules, on the emulator (`npm run test:rules`) |

```bash
npm run test
```

## Deployment

Deploy as a standard Next.js app (for example on Vercel or any Node.js host):

1. Set the environment variables above in the hosting provider.
2. Run `npm run build`.
3. Start with `npm run start`.

Firestore security rules live in `firestore.rules` and are deployed with the Firebase CLI (`firebase deploy --only firestore:rules`).

## Known Notes

- **`.firebaserc` vs the app's Firebase project** — `.firebaserc` only scopes the Firebase **CLI** (e.g. deploying `firestore.rules`); the project the running app reads/writes is set by the `NEXT_PUBLIC_FIREBASE_*` env vars. Both now target `gurdiane-75091`.
- **`firestore.rules` is shared across five clients** — this web app, the iOS and Android parent apps (authenticated), and the iOS and Android kid apps, which use **no Firebase Auth for Firestore** (they sign in anonymously only for the AI routes). The rules therefore leave every child-touched collection open to unauthenticated access and gate only parent-only writes behind auth. Do not add `request.auth` requirements to child-touched collections without first adding auth to the child app, or it will break instantly. The ruleset is covered by an emulator test suite: `npm run test:rules` (needs Java 21+ and the Firebase CLI; CI runs it too).
- **Guest chat is client-only** — public `/chatbot` history lives in `sessionStorage` and the trial counter in `localStorage`; nothing is written to Firestore for guests. The server caps guests at 30 messages a day per IP.
- **Email verification test account** — `test@gmail.com` skips email verification on the web and iOS parent apps (`app/lib/emailVerification.js`). Kept on purpose for testing; remove before launch.

## Developer

Rishabh Bhargav — Lead Developer
</content>
</invoke>

## Observability (OpenTelemetry)

`instrumentation.js` registers OpenTelemetry via `@vercel/otel` (service name `guardiane-web`). Route handlers, server rendering, and outgoing `fetch` calls are traced automatically.

- **On Vercel:** add an OpenTelemetry-compatible integration (e.g. Datadog, Honeycomb, Grafana) or a trace drain in the project settings.
- **Anywhere else:** set `OTEL_EXPORTER_OTLP_ENDPOINT` (e.g. `https://otlp-gateway-prod-us-east-0.grafana.net/otlp`) and, if the collector needs auth, `OTEL_EXPORTER_OTLP_HEADERS` (e.g. `Authorization=Basic <token>`).

With neither configured, spans are dropped and nothing is sent.
