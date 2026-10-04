export type AppEnv = {
  Bindings: {
    APP_NAME?: string;
    APP_ENV?: string;
  };
  Variables: { requestId: string };
};
