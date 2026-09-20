// Render an email with sample data and open it in the browser.
//   node scripts/preview-email.mjs [reset|verify] [out.html]
import { writeFileSync } from "node:fs";
import { execFile } from "node:child_process";
import { passwordResetEmail } from "../app/lib/emails/passwordReset.js";
import { verifyEmailEmail } from "../app/lib/emails/verifyEmail.js";

const kind = process.argv[2] === "verify" ? "verify" : "reset";
const out =
  process.argv[3] ??
  `/tmp/guardiane-${kind === "verify" ? "verify-email" : "password-reset"}-preview.html`;
const sample = {
  link: "https://guardiane.app/__/auth/action?mode=SAMPLE&oobCode=SAMPLE_CODE&apiKey=SAMPLE",
  email: "sarah@example.com",
  name: "Sarah Johnson",
};
const { html, subject } = (
  kind === "verify" ? verifyEmailEmail : passwordResetEmail
)(sample);
writeFileSync(out, html);
console.log(`Subject: ${subject}\nWrote ${out}`);
execFile("open", [out]);
