// JoJo chat client. Talks to /api/jojo (server-side proxy) which forwards to
// the deployed `chatWithAgent` Cloud Function with the shared API key.
//
// Contract:
//   send:  { messages: [{ role: "user"|"assistant", content: string }, ...] }
//   recv:  { reply: string }

const PROXY_URL = '/api/jojo'

export class JojoChatError extends Error {
  constructor(message, { code, status } = {}) {
    super(message)
    this.name = 'JojoChatError'
    if (code) this.code = code
    if (status) this.status = status
  }
}

export function validateChatMessage(message) {
  if (typeof message !== 'string' || message.trim().length === 0) {
    throw new JojoChatError('Message is required', { code: 'MISSING_MESSAGE' })
  }
  if (message.length > 4000) {
    throw new JojoChatError('Message is too long (max 4000 characters)', {
      code: 'MESSAGE_TOO_LONG',
    })
  }
}

export async function sendJojoMessage({ messages }) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new JojoChatError('Messages are required', { code: 'MISSING_MESSAGES' })
  }
  const last = messages[messages.length - 1]
  validateChatMessage(last?.content)

  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  let body
  try {
    body = await res.json()
  } catch (_) {
    throw new JojoChatError('Failed to decode server response', {
      code: 'DECODING_ERROR',
      status: res.status,
    })
  }

  if (!res.ok) {
    throw new JojoChatError(body?.error || `HTTP ${res.status}`, {
      status: res.status,
    })
  }

  if (typeof body?.reply !== 'string') {
    throw new JojoChatError('Malformed response from server', {
      code: 'DECODING_ERROR',
    })
  }
  return body.reply
}
