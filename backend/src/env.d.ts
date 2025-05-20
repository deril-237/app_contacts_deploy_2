declare namespace NodeJs {
  interface ProcessEnv {
    port?: string;
    APP_URL: string;
    DB_NAME: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_HOST: string;
    DB_CONNECTION: string;
    DEFAULT_PASSWORD_ADMIN: string;
    SALT_HASH: string;
    PRIVATE_KEY_JWT_ACCESS_TOKEN: string;
    PRIVATE_KEY_JWT_REFRESH_TOKEN_TOKEN: string;
  }
}