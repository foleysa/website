import { handleUnsubscribe, vercelHandler } from '../mailer/src/http.js';

export default vercelHandler(handleUnsubscribe);
