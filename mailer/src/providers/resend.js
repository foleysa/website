export function createResendProvider({ apiKey, fetchImpl = fetch }) {
  if (!apiKey) throw new Error('RESEND_API_KEY is required for the Resend provider');
  return {
    name: 'resend',
    live: true,
    async send(message) {
      const res = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: message.from,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          reply_to: message.replyTo || undefined,
          headers: message.headers || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(`Resend ${res.status}: ${body.message || JSON.stringify(body)}`);
      }
      return { id: body.id, provider: 'resend' };
    },
  };
}
