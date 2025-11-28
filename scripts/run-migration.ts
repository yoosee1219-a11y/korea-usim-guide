import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

async function runMigration(migrationFile: string) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log(`🔄 Running migration: ${migrationFile}...`);

    const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    await pool.query(sql);

    console.log(`✅ Migration ${migrationFile} completed successfully!`);
  } catch (error) {
    console.error(`❌ Error running migration ${migrationFile}:`, error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Get migration file from command line argument or use default
const migrationFile = process.argv[2] || '004_add_multilingual_content.sql';

runMigration(migrationFile).catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
