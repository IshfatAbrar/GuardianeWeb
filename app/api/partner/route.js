import { Resend } from "resend";

const DEFAULT_INBOX = "tingting.zhang@guardianeusa.com";
const MAX = { name: 200, email: 254, organization: 200, message: 10000 };

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function trimField(value, max) {
  if (typeof value !== "string") {
    return "";
  }
  const t = value.trim();
  return t.length > max ? t.slice(0, max) : t;
}

export async function POST(request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Email service is not configured." },
      { status: 503 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = trimField(body?.name, MAX.name);
  const email = trimField(body?.email, MAX.email);
  const organization = trimField(body?.organization, MAX.organization);
  const message = trimField(body?.message, MAX.message);

  if (!name || !email || !organization || !message) {
    return Response.json(
      { error: "Please fill in all required fields." },
      { status: 400 },
    );
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return Response.json({ error: "Please enter a valid email address." }, {
      status: 400,
    });
  }

  const to = process.env.PARTNER_INBOX_EMAIL?.trim() || DEFAULT_INBOX;
  const from =
    process.env.RESEND_FROM?.trim() ||
    "AI-Guardian Center <onboarding@resend.dev>";

  const subject = `Partner inquiry: ${organization} — ${name}`;

  const text = [
    "New partnership form submission (AI-Guardian Center website)",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Organization: ${organization}`,
    "",
    "Message:",
    message,
  ].join("\n");

  const html = `
    <p><strong>Partner form</strong> (website)</p>
    <p><strong>Name:</strong> ${escapeHtml(name)}<br/>
    <strong>Email:</strong> ${escapeHtml(email)}<br/>
    <strong>Organization:</strong> ${escapeHtml(organization)}</p>
    <p><strong>Message:</strong></p>
    <pre style="font-family:system-ui,sans-serif;white-space:pre-wrap;">${escapeHtml(
      message,
    )}</pre>
  `;

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: email,
    subject,
    text,
    html,
  });

  if (error) {
    return Response.json(
      { error: error.message || "Could not send email." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true, id: data?.id ?? null });
}
