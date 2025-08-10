import {config} from 'dotenv';

config();

const env = process.env;

export default {
    JWT_SECRET: env.JWT_SECRET!,
    JWT_EXPIRATION: env.JWT_EXPIRATION!,
    PORT:  Number(env.port ?? 3000),
    DB_URL: env.DB_URL!,
};