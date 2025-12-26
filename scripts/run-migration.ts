import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { Client } from 'pg';

// .env 파일 로드
config();

async function runMigration(migrationFile: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const sql = readFileSync(migrationFile, 'utf-8');
    console.log(`📄 Running migration: ${migrationFile}`);

    await client.query(sql);
    console.log('✅ Migration completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// 명령줄 인자로 마이그레이션 파일 받기
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: npx tsx scripts/run-migration.ts <migration-file>');
  process.exit(1);
}

runMigration(migrationFile)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
