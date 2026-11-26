import joi from 'joi';

export const envSchema = joi.object({
  DATABASE_URL: joi.string().optional(),
  FRONTEND_URL: joi.string().default('http://localhost:5173'),
  PORT: joi.number().positive().default(3000),
  JWT_SECRET: joi.string().default('changeme'),
  ADMIN_USERNAME: joi.string().default('admin'),
  ADMIN_PASSWORD: joi.string().default('admin123'),
  DEFAULT_ADMIN_USER: joi.string().default('admin'),
  DEFAULT_ADMIN_PASSWORD: joi.string().default('admin123'),
});
