import { config } from 'dotenv';

config();

const env = process.env;

export default {
  JWT_SECRET: env.JWT_SECRET!,
  PORT: Number(env.port ?? 3000),
  DB_URL: env.DB_URL!
};
