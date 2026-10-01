type LogFields = Record<string, string | number | boolean | null | undefined>;

function write(level: 'info' | 'warn' | 'error', event: string, fields: LogFields) {
  const line = JSON.stringify({ level, event, at: new Date().toISOString(), ...fields });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
}

/** Structured server logs. Pass identifiers only: never emails, nicknames, tokens, or request bodies. */
export const log = {
  info: (event: string, fields: LogFields = {}) => write('info', event, fields),
  warn: (event: string, fields: LogFields = {}) => write('warn', event, fields),
  error: (event: string, fields: LogFields = {}) => write('error', event, fields)
};

export function errorName(error: unknown): string {
  if (error instanceof Error) return error.name === 'Error' ? error.message.slice(0, 120) : error.name;
  return 'unknown';
}
