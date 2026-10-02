import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local', quiet: true });

const url = process.env.DATABASE_URL_UNPOOLED ?? '';
const needsDatabase = !process.argv.includes('generate');
if (needsDatabase && !url) {
  throw new Error('DATABASE_URL_UNPOOLED is required (direct, non-pooled Neon connection string).');
}

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
  strict: true,
  verbose: true
});
