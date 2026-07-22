/**
 * Published store URLs. Override via env when the listings go live.
 *
 * The package ids are the real ones shipped by the two Android apps — GuardParent's
 * app.json and the child app's build.gradle, not the docs, which still carry
 * `com.yourcompany.*` placeholders. Mind that the two spell the brand differently:
 * the parent app is com.guard**i**ane.parent, the child app com.gurdiane.child.
 *
 * There is no iOS listing yet, so APP_STORE_URL stays a bare storefront link.
 */
export const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL ??
  "https://play.google.com/store/apps/details?id=com.guardiane.parent";

/** The child's companion app — what the QR code on the dashboard pairs with. */
export const CHILD_PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_CHILD_PLAY_STORE_URL ??
  "https://play.google.com/store/apps/details?id=com.gurdiane.child";

export const APP_STORE_URL =
  process.env.NEXT_PUBLIC_APP_STORE_URL ?? "https://apps.apple.com/";
