import { defineConfig } from 'drizzle-kit';
import envConfig from './env.config';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema/**/*',
  out: './src/database/migrations',
  dbCredentials: {
    url: envConfig.DB_URL
  }
});
