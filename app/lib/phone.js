// Parent phone validation.
//
// The child app's crisis screen dials `users/{parentId}.phone`, and hides the
// call button when it's empty — so a parent account without a usable number
// silently leaves their child with no way to call them. The iOS parent app
// requires >= 10 digits at signup; this matches that floor and caps at 15 (the
// E.164 maximum) so the value is always something a dialler accepts.

const MIN_DIGITS = 10;
const MAX_DIGITS = 15;

/** Free text is fine ("+1 (555) 123-4567"), but only phone-like characters. */
const ALLOWED = /^\+?[\d\s().-]+$/;

export function isValidPhone(phone) {
  const value = String(phone ?? "").trim();
  if (!ALLOWED.test(value)) return false;
  const digits = value.replace(/\D/g, "").length;
  return digits >= MIN_DIGITS && digits <= MAX_DIGITS;
}

export const PHONE_ERROR =
  "Please enter a valid phone number (10–15 digits, e.g. +1 555 123 4567).";
