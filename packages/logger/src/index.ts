import pino from 'pino';

const rootLogger = pino(); // .child('devtools');
export const logger = rootLogger.child({ context: 'devtools' });

class Logger {
  constructor(readonly context: string) {}
}
