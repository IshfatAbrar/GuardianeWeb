"use client";

import { APP_STORE_URL, PLAY_STORE_URL } from "../lib/storeLinks";

export function DownloadButtons({
  className = "flex flex-col gap-3 sm:flex-row",
  buttonClassName = "",
}) {
  return (
    <div className="flex flex-col items-center">
      <div className={className}>
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`focus-visible-ring brand-btn rounded-full px-7 py-3 text-sm font-medium ${buttonClassName}`}
        >
          App Store
        </a>
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`focus-visible-ring outline-btn rounded-full px-7 py-3 text-sm font-medium ${buttonClassName}`}
        >
          Google Play
        </a>
      </div>
      <p className="mt-2 text-center text-sm text-white">
        By downloading our app, you agree with our{" "}
        <a
          href="/Guardiane_Terms_of_Service_publish_ready.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-base font-semibold text-white underline underline-offset-4"
        >
          Terms Of Use
        </a>
        .
      </p>
    </div>
  );
}
