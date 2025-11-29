import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT_APIAUTH: number;
  JWT_SECRET: string;
  JWT_ACCESS_EXPIRATION: string;
  JWT_REFRESH_EXPIRATION: string;
}

const envsSchema = joi
  .object({
    PORT_APIAUTH: joi.number().required(),
    JWT_SECRET: joi.string().required(),
    JWT_ACCESS_EXPIRATION: joi.string().required(),
    JWT_REFRESH_EXPIRATION: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate({
  ...process.env,
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  portApiAuth: envVars.PORT_APIAUTH,
  jwtSecret: envVars.JWT_SECRET,
  jwtAccessExpiration: envVars.JWT_ACCESS_EXPIRATION,
  jwtRefreshExpiration: envVars.JWT_REFRESH_EXPIRATION,
};
