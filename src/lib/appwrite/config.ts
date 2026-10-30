import { Client, Account, Teams, TablesDB, Role, Permission } from 'appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6ae4f8d4000fe676e1aa';
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6ae4fc0f00271732d094';

export const isAppwriteConfigured = () => {
  return (
    typeof projectId === 'string' &&
    projectId.trim().length > 0 &&
    !projectId.includes('your-project-id') &&
    projectId !== 'placeholder'
  );
};

export const client = new Client();
client.setEndpoint(endpoint).setProject(projectId);

// Ping test on start
if (typeof window !== 'undefined') {
  client.ping().then(
    (res) => console.log('✓ Appwrite ping successful:', res),
    (err) => console.warn('Appwrite ping notice (check Web Platform localhost in console):', err)
  );
}

export const accountService = new Account(client);
export const teamsService = new Teams(client);
export const tablesDB = new TablesDB(client);

export { Role, Permission };
