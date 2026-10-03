export function createMockProvider() {
  const sent = [];
  return {
    name: 'mock',
    live: false,
    sent,
    async send(message) {
      const record = {
        id: `mock_${sent.length + 1}`,
        at: new Date().toISOString(),
        ...message,
      };
      sent.push(record);
      return { id: record.id, provider: 'mock', skipped: true };
    },
  };
}
