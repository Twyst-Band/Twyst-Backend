import { config } from 'dotenv';

config();

const env = process.env;

export default {
  JWT_SECRET: env.JWT_SECRET!,
  PORT: Number(env.port ?? 3000),
  DB_URL: env.DB_URL!,

  VERIFY_EMAILS: env.VERIFY_EMAILS === 'true',
  FRONTEND_URL: env.FRONTEND_URL!,

  MAIL_HOST: env.MAIL_HOST!,
  MAIL_PORT: Number(env.MAIL_PORT!),
  MAIL_SECURE: env.MAIL_SECURE === 'true',
  MAIL_USER: env.MAIL_USER!,
  MAIL_PASSWORD: env.MAIL_PASSWORD!
};
