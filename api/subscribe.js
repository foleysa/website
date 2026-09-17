import { handleSubscribe, vercelHandler } from '../mailer/src/http.js';

export default vercelHandler(handleSubscribe);
