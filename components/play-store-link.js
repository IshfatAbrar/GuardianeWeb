"use client";

import {
  PLAY_STORE_MARKET_URL,
  PLAY_STORE_URL,
  isAndroidUserAgent,
} from "../lib/storeLinks";

/**
 * Link to a Google Play listing. On Android, opens the Play Store app via
 * market://; on other platforms, opens the https listing in a new tab.
 */
export function PlayStoreLink({
  href = PLAY_STORE_URL,
  marketHref = PLAY_STORE_MARKET_URL,
  className,
  children,
  "aria-label": ariaLabel,
}) {
  return (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        if (!isAndroidUserAgent() || !marketHref) return;
        event.preventDefault();
        window.location.href = marketHref;
      }}
    >
      {children}
    </a>
  );
}
