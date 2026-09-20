"use client";

import { Blobatar } from "@blobatar/react";
import { useGaze } from "@blobatar/react/gaze";
import { happy } from "blobatar/expression";
import "blobatar/motion.css";
import "blobatar/gaze.css";

// JoJo is one fixed character: the same seed and look everywhere it appears, so
// the chatbot, the dashboard and the landing preview all show the same face.
// A blue triangle, alive (breathing, blinking), with no backdrop.
//
// `hue` is not a plain color wheel angle: 255 with tone 0.45 lands on #6baafb.
// `traits.shape` is a position in the shape table; 0.99 is the triangle band.
const JOJO_SEED = "jojo";

// How far the eyes travel toward the pointer, in the blobatar's own units.
const GAZE_TRAVEL = 4;

function Jojo({ size, alt, className, innerRef }) {
  return (
    <Blobatar
      ref={innerRef}
      name={JOJO_SEED}
      size={size}
      hue={255}
      tone={0.45}
      traits={{ shape: 0.99 }}
      background={false}
      expression={happy}
      animate="always"
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={className}
    />
  );
}

// Hooks can't be conditional, so the pointer-tracking version is its own
// component. Only the large hero avatar pays for the pointer driver.
function FollowingJojo(props) {
  const { ref } = useGaze({ travel: GAZE_TRAVEL, lookAt: "pointer" });
  return <Jojo {...props} innerRef={ref} />;
}

export function JojoAvatar({ size = 44, alt = "", className, follow = false }) {
  const Component = follow ? FollowingJojo : Jojo;
  return <Component size={size} alt={alt} className={className} />;
}
