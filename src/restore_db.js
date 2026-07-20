const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  console.log('Starting DB restore process...');
  
  // 1. Install pg client dynamically if not present
  try {
    require.resolve('pg');
    console.log('pg client is already installed.');
  } catch (e) {
    console.log('Installing pg client dynamically...');
    execSync('npm install pg', { stdio: 'inherit' });
  }

  const { Client } = require('pg');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is missing.');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  
  try {
    console.log('Connecting to the database...');
    await client.connect();
    console.log('Connected successfully.');

    const dumpPath = path.join(__dirname, 'local_dump.sql');
    if (!fs.existsSync(dumpPath)) {
      console.error(`Backup file not found at: ${dumpPath}`);
      process.exit(1);
    }

    console.log('Reading local_dump.sql...');
    const sql = fs.readFileSync(dumpPath, 'utf8');

    console.log('Executing database dump SQL (this may take a few seconds)...');
    await client.query(sql);
    console.log('Database restore completed successfully! 🎉');
  } catch (error) {
    console.error('An error occurred during restore:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
