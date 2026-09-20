"use client";

import { Blobatar } from "@blobatar/react";
import { happy, idle, unsure, sad } from "blobatar/expression";
import "blobatar/motion.css";

// One pose per mood band, best → worst. The color is the same yellow for every
// band; the pose carries the mood, and the label beside it carries the band
// color (see app/lib/mood.js).
const EXPRESSION = { great: happy, good: idle, fair: unsure, poor: sad };

/**
 * A child's mood as a live, yellow, organic blobatar with no backdrop. `name`
 * seeds the details (eyes, proportions) so each child keeps their own blob; the
 * silhouette is pinned to "organic" (0.35 sits inside that band) and the band
 * drives the pose.
 */
export function MoodAvatar({ band, name, size = 130 }) {
  return (
    <Blobatar
      name={name || "child"}
      size={size}
      hue={90}
      tone={0.9}
      traits={{ shape: 0.35 }}
      background={false}
      expression={EXPRESSION[band] ?? idle}
      animate="always"
      aria-hidden
    />
  );
}
