import { handleHealth, vercelHandler } from '../mailer/src/http.js';

export default vercelHandler((ctx) => handleHealth(ctx));
