import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT_NETFLIX: number;
}

const envsSchema = joi
  .object({
    PORT_NETFLIX: joi.number().required(),
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
  portNetflix: envVars.PORT_NETFLIX,
};
