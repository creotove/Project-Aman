import { bool, cleanEnv, port, str } from 'envalid';

export const ValidateEnv = () => {
  cleanEnv(process.env, {
    NODE_ENV: str(),
    PORT: port(),
    DB_HOST: str(),
    DB_PORT: str(),
    DB_DATABASE: str(),
    LOG_FORMAT: str(),
    LOG_DIR: str(),
    ORIGIN: str(),
    CREDENTIALS: bool(),
  });
};
