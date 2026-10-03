import { createMockProvider } from './mock.js';
import { createResendProvider } from './resend.js';
import { createPostmarkProvider } from './postmark.js';

export function createProvider(config, extras = {}) {
  if (config.provider === 'resend') {
    return createResendProvider({ apiKey: config.resendApiKey, fetchImpl: extras.fetchImpl });
  }
  if (config.provider === 'postmark') {
    return createPostmarkProvider({
      serverToken: config.postmarkToken,
      messageStream: config.postmarkStream,
      fetchImpl: extras.fetchImpl,
    });
  }
  return createMockProvider();
}
