import joi from 'joi';

export const envSchema = joi.object({
  FRONTEND_URL: joi.string().default('http://localhost:5173'),
  PORT: joi.number().positive().default(3000),
  JWT_SECRET: joi.string().default('changeme'),
  ADMIN_USERNAME: joi.string().default('admin'),
  ADMIN_PASSWORD: joi.string().default('admin123'),
});
