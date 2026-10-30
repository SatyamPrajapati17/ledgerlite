const { Client, TablesDB } = require('node-appwrite');
const fs = require('fs');
const path = require('path');

function getApiKey() {
  if (process.env.APPWRITE_API_KEY) return process.env.APPWRITE_API_KEY;
  try {
    const envFile = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8');
    const match = envFile.match(/APPWRITE_API_KEY=(.*)/);
    if (match && match[1]) return match[1].trim();
  } catch (e) {}
  return '';
}

const apiKey = getApiKey();
if (!apiKey) {
  console.warn('Notice: APPWRITE_API_KEY not found in environment or .env.local');
}

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '6ae4f8d4000fe676e1aa')
  .setKey(apiKey);

const tablesDB = new TablesDB(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || '6ae4fc0f00271732d094';

tablesDB.listTables(databaseId).then(res => {
  console.log(`TOTAL TABLES IN APPWRITE DATABASE: ${res.total}`);
  res.tables.forEach(t => console.log(`✓ ${t.$id} (${t.name})`));
}).catch(console.error);
