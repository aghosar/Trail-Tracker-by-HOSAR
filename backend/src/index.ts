import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema/schema.js';
import * as authSchema from './db/schema/auth-schema.js';
import { registerEmergencyContactRoutes } from './routes/emergency-contacts.js';
import { registerTripRoutes } from './routes/trips.js';

const schema = { ...appSchema, ...authSchema };

export const app = await createApplication(schema);

export type App = typeof app;

app.withAuth();

registerEmergencyContactRoutes(app);
registerTripRoutes(app);

await app.run();
app.logger.info('Application running');
