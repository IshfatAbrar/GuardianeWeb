// Module card palette, shared by the home carousel, the Learning Hub cards and
// the assignment cards so a module wears the same color in all three (see
// `moduleColorFor`): Papaya Cream, Mango Sorbet, Lagoon Blue, Mint Gelato.
//
// The colors are CSS variables (defined in app/globals.css, with a deepened
// dark-mode set) rather than literals, so they follow the theme. `ink` is dark
// on the light fills and light on the dark ones. `solid` is a deeper tone for
// small accents on a white card (progress bars).
export const moduleColors = [1, 2, 3, 4].map((n) => ({
  bg: `var(--mod-${n}-bg)`,
  solid: `var(--mod-${n}-solid)`,
  ink: "var(--mod-ink)",
  badge: "var(--mod-chip)",
  icon: "var(--mod-chip)",
}));

/**
 * The palette entry for a module, chosen from its id so the same module gets
 * the same color on the home carousel and in the Learning Hub, whatever order
 * either list is in.
 */
export function moduleColorFor(id) {
  const key = String(id ?? "");
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return moduleColors[hash % moduleColors.length];
}
