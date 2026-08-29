/** Shared site chrome (header, contact, partner form). */
export const contactEmail = "tingting.zhang@guardianeusa.com";
export const supportEmail = "support@guardiane.app";
export const supportPath = "/support";

/**
 * Nav entries — use /#id for home sections so links work from any route.
 * A plain entry is { label, href, badge? }; a grouped entry is
 * { label, items: [[label, href], ...] } and renders as a dropdown.
 */
export const mainNavLinks = [
  { label: "Guardiané", href: "/guardiane" },
  {
    label: "About",
    items: [
      ["Who We Are", "/#about"],
      ["Why It Matters", "/#why"],
    ],
  },
  { label: "Team", href: "/#team" },
  { label: "Careers", href: "/#careers" },
  { label: "Jojo", href: "/chatbot", badge: "beta" },
];
