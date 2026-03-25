# Parent app — Agent guide (this repository)

This document is for AI agents (and humans) working on **this repo**: the **parent-facing Expo (React Native) mobile app**. It is **not** the child mobile app or a standalone marketing website. Use it to stay accurate, consistent, and on-scope.

## Relationship to the child app

The **child app** (e.g. Guardiané) is a separate codebase: it is child-facing and may sync mood, screen time, messages, and learning data through **Firebase**. **This repo** is the **parent/guardian dashboard** that signs in as the parent, selects a child profile, and reads or manages family data in the same Firebase project (Firestore collections documented in `README.md`). When describing features, distinguish **what the parent sees here** from what happens only on the child device.

## Product identity (this repo)

| Item                 | Value                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Role**             | Parent/guardian mobile app (dashboard)                                                                                                                                                                                      |
| **Expo name / slug** | `parent` (see `app.json`)                                                                                                                                                                                                   |
| **URL scheme**       | `parent-app`                                                                                                                                                                                                                |
| **Android package**  | `com.yourcompany.parent` (update in `app.json` for production)                                                                                                                                                              |
| **What it is**       | An Expo SDK 54 app for **parents**: learning hub, messaging, emergency contacts, per-child mood and screen-time views, alerts, map, and settings — backed by **Firebase Authentication** and **Firestore** when configured. |

## One-sentence pitch

The parent app lets guardians sign in, pick a linked child, and monitor wellbeing and activity signals (mood, screen time, alerts), communicate via messages, manage emergency contacts, explore learning modules (including assigning child modules), and use the other drawer destinations — all tied to Firestore data shared with the child app where applicable.

## Who it’s for

- **Primary users**: Parents or guardians using their own device.
- **Not primary here**: Children using the app as their main experience — that is the child app’s job.

## Features to treat as source of truth (plain language)

Use the root **`README.md`** as the canonical list; align descriptions with these areas:

1. **Authentication** — Firebase Auth with session persistence; unauthenticated users are routed to login (`app/_layout.js`).
2. **Child context** — Drawer supports **selected child**; parent can switch children and use **QR-related flows** for linking (see `components/CustomDrawerContent.js`).
3. **Home** — Family/child overview; mood level visualization, screen-time-related UI, unread message counts, recent alerts (uses `DatabaseService` + selected child).
4. **Report** — Mood history and screen-time reporting with time ranges (e.g. week / month / year), charts (`MoodChart` / `DonutChart` patterns).
5. **Learning modules** — Hub, module detail, built-in JSON lessons (`data/lessons.json`) plus Firestore modules/lessons; create module/lesson; interactive lesson player; progress in `learning_progress`; assignments for child modules as implemented.
6. **Messaging** — Parent ↔ child messaging via Firestore (`messages`), with real-time listeners as documented in `README.md`.
7. **Emergency contacts** — CRUD for family emergency contacts.
8. **Alerts** — Alerts surface for the parent (implementation in `app/alerts.js`).
9. **Map** — Location map experience (`app/map.js`).
10. **Settings** — App/settings screen (`app/settings.js`).
11. **Screen time insights** — Aggregates from `screen_time_entries` (e.g. top apps, percentages) for reporting windows.

If a feature is **Android- or iOS-specific** in behavior, do not claim parity across platforms unless the code and product owners confirm it.

## Firestore (high level)

The **`README.md`** lists collections used by this app (e.g. `users`, `modules`, `lessons` under modules, `learning_progress`, `mood_entries`, `screen_time_entries`, `messages`, `emergency_contacts`). Use that section for accuracy; do not invent collection names or fields for public/legal copy without an approved privacy policy.

## What agents should do in this repo

- Implement or fix **parent-app** behavior: navigation (`expo-router` drawer), `AuthContext`, `services/database.js`, and screens under `app/`.
- Match existing patterns: Epilogue fonts, drawer structure, `DatabaseService` usage.
- Prefer **`README.md`** for features, setup, EAS build notes, and troubleshooting.

## What agents should not assume

- **Do not** treat this repo as the child app or as the only place Guardiané branding applies — child UX and store listings live elsewhere unless this project is explicitly unified later.
- **Do not** promise compliance, timelines, or legal claims not confirmed by the team.
- **Do not** fabricate testimonials, metrics, or partnerships in any user-facing copy.

## Where to look in the repo

| Topic                                    | Location                            |
| ---------------------------------------- | ----------------------------------- |
| Feature overview & Firestore collections | `README.md`                         |
| Navigation & auth gating                 | `app/_layout.js`                    |
| Drawer & child selection / QR            | `components/CustomDrawerContent.js` |
| Firebase init                            | `firebaseConfig.js`                 |
| Data access patterns                     | `services/database.js`              |
| Expo / Android identifiers               | `app.json`                          |
| EAS build                                | `eas.json`                          |

---

_Last aligned with `README.md` and app layout; if they drift, prefer the README and source files over this guide._
