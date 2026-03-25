/**
 * Published store URLs. Override via env when your listings are live.
 * Android package placeholder matches agent_guide.md — update in app.json for production.
 */
export const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL ??
  "https://play.google.com/store/apps/details?id=com.yourcompany.parent";

export const APP_STORE_URL =
  process.env.NEXT_PUBLIC_APP_STORE_URL ?? "https://apps.apple.com/";
