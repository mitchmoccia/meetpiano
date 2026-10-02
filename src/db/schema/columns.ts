import { timestamp } from 'drizzle-orm/pg-core';

export const timestampTz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const createdAt = () => timestampTz('created_at').notNull().defaultNow();

export const updatedAt = () =>
  timestampTz('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());
