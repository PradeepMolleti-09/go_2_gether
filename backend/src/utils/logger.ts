// very small logger wrapper for now; can be replaced with Winston/Pino later
export const logger = {
  info: (msg: string, ...meta: any[]) => {
    // eslint-disable-next-line no-console
    console.log(msg, ...meta);
  },
  error: (msg: string, ...meta: any[]) => {
    // eslint-disable-next-line no-console
    console.error(msg, ...meta);
  },
};

