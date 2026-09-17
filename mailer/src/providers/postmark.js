export function createPostmarkProvider({ serverToken, messageStream = 'broadcast', fetchImpl = fetch }) {
  if (!serverToken) throw new Error('POSTMARK_SERVER_TOKEN is required for the Postmark provider');
  return {
    name: 'postmark',
    live: true,
    async send(message) {
      const res = await fetchImpl('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'X-Postmark-Server-Token': serverToken,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          From: message.from,
          To: message.to,
          Subject: message.subject,
          HtmlBody: message.html,
          ReplyTo: message.replyTo || undefined,
          MessageStream: messageStream,
          Headers: Object.entries(message.headers || {}).map(([Name, Value]) => ({ Name, Value })),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(`Postmark ${res.status}: ${body.Message || JSON.stringify(body)}`);
      }
      return { id: body.MessageID, provider: 'postmark' };
    },
  };
}
