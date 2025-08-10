import { DrizzlePGModule } from '@knaadh/nestjs-drizzle-pg';
import envConfig from '../../env.config';

export const DatabaseModule = DrizzlePGModule.register({
  tag: 'DB',
  pg: {
    connection: 'client',
    config: {
      connectionString: envConfig.DB_URL
    }
  }
});
