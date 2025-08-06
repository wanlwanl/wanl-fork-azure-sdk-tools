import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export function applyDotEnv() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const envPath = join(__dirname, `../../env/.env.${process.env.NODE_ENV}`);
  dotenv.config({ path: envPath });
}
