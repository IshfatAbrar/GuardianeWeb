/**
 * Published store URLs. Override via env when the listings go live.
 *
 * The package ids are the real ones shipped by the two Android apps — GuardParent's
 * app.json and the child app's build.gradle, not the docs, which still carry
 * `com.yourcompany.*` placeholders. Mind that the two spell the brand differently:
 * the parent app is com.guard**i**ane.parent, the child app com.gurdiane.child.
 *
 * There is no iOS listing yet, so APP_STORE_URL stays a bare storefront link.
 *
 * On Android, prefer the market:// scheme so the Play Store app opens instead of
 * the browser. The https URL is the fallback for desktop and non-Android devices.
 */
export const PLAY_STORE_PACKAGE_ID = "com.guardiane.parent";

export const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL ??
  `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE_ID}&hl=en_US`;

export const PLAY_STORE_MARKET_URL = `market://details?id=${PLAY_STORE_PACKAGE_ID}`;

/** The child's companion app — what the QR code on the dashboard pairs with. */
export const CHILD_PLAY_STORE_PACKAGE_ID = "com.gurdiane.child";

export const CHILD_PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_CHILD_PLAY_STORE_URL ??
  `https://play.google.com/store/apps/details?id=${CHILD_PLAY_STORE_PACKAGE_ID}&hl=en_US`;

export const CHILD_PLAY_STORE_MARKET_URL = `market://details?id=${CHILD_PLAY_STORE_PACKAGE_ID}`;

export const APP_STORE_URL =
  process.env.NEXT_PUBLIC_APP_STORE_URL ?? "https://apps.apple.com/";

/** True when the user agent looks like Android (client-only). */
export function isAndroidUserAgent() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

/**
 * Navigate to a Play Store listing. On Android phones this opens the Play Store
 * app via market://; elsewhere it uses the https listing (new tab when possible).
 */
export function openPlayStore(webUrl, marketUrl) {
  if (typeof window === "undefined") return;

  if (isAndroidUserAgent() && marketUrl) {
    window.location.href = marketUrl;
    return;
  }

  window.open(webUrl, "_blank", "noopener,noreferrer");
}
