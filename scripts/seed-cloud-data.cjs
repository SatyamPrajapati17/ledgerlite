const { Client, TablesDB, ID, Permission, Role } = require('node-appwrite');
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

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '6ae4f8d4000fe676e1aa')
  .setKey(getApiKey());

const tablesDB = new TablesDB(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || '6ae4fc0f00271732d094';
const companyId = 'team_apex_global';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function safeRow(tableId, rowId, data) {
  try {
    await tablesDB.createRow({
      databaseId,
      tableId,
      rowId,
      data,
      permissions: [
        Permission.read(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any())
      ]
    });
    console.log(`✓ Row: ${tableId}/${rowId}`);
    await sleep(250);
  } catch (err) {
    if (err.message && (err.message.includes('already exists') || err.code === 409)) {
      console.log(`- Row: ${tableId}/${rowId} (exists)`);
    } else {
      console.warn(`! Row: ${tableId}/${rowId}:`, err.message);
    }
  }
}

async function run() {
  console.log(`Seeding initial company & accounts into database ${databaseId}...`);

  // 1. Company
  await safeRow('companies', companyId, {
    name: 'Apex Global Inc',
    legalName: 'Apex Global Technologies Pvt. Ltd.',
    currency: 'INR',
    fiscalYearStartMonth: 4,
    taxLabel: 'GST',
    ownerId: 'user_founder'
  });

  // 2. Counters
  await safeRow('counters', `counter_${companyId}_entry`, {
    companyId,
    counterKey: 'entry',
    value: 10
  });

  await safeRow('counters', `counter_${companyId}_invoice`, {
    companyId,
    counterKey: 'invoice',
    value: 5
  });

  // 3. 21 Accounts
  const tpls = [
    { code: '1000', name: 'Cash on Hand', type: 'asset', normalSide: 'debit', systemKey: 'cash' },
    { code: '1010', name: 'Primary Bank Account', type: 'asset', normalSide: 'debit', systemKey: 'bank' },
    { code: '1100', name: 'Accounts Receivable', type: 'asset', normalSide: 'debit', systemKey: 'ar' },
    { code: '1500', name: 'Computers & Equipment', type: 'asset', normalSide: 'debit' },
    { code: '2000', name: 'Accounts Payable', type: 'liability', normalSide: 'credit', systemKey: 'ap' },
    { code: '2100', name: 'Tax / GST Payable', type: 'liability', normalSide: 'credit', systemKey: 'tax_payable' },
    { code: '2500', name: 'Bank Business Loan', type: 'liability', normalSide: 'credit' },
    { code: '3000', name: "Owner's Capital", type: 'equity', normalSide: 'credit' },
    { code: '3100', name: 'Retained Earnings', type: 'equity', normalSide: 'credit' },
    { code: '4000', name: 'Software Sales Revenue', type: 'income', normalSide: 'credit', systemKey: 'revenue' },
    { code: '4100', name: 'Consulting & Service Revenue', type: 'income', normalSide: 'credit' },
    { code: '4900', name: 'Other Income', type: 'income', normalSide: 'credit' },
    { code: '5000', name: 'Cost of Goods Sold', type: 'expense', normalSide: 'debit' },
    { code: '5100', name: 'Salaries & Wages', type: 'expense', normalSide: 'debit' },
    { code: '5200', name: 'Office Rent', type: 'expense', normalSide: 'debit' },
    { code: '5300', name: 'Utilities & Internet', type: 'expense', normalSide: 'debit' },
    { code: '5400', name: 'Software & Cloud Services', type: 'expense', normalSide: 'debit' },
    { code: '5500', name: 'Marketing & Ads', type: 'expense', normalSide: 'debit' },
    { code: '5600', name: 'Office Supplies & Stationery', type: 'expense', normalSide: 'debit' },
    { code: '5700', name: 'Bank Charges & Fees', type: 'expense', normalSide: 'debit' },
    { code: '5900', name: 'Miscellaneous Expenses', type: 'expense', normalSide: 'debit', systemKey: 'expense_default' },
  ];

  for (const t of tpls) {
    await safeRow('accounts', `acc_${companyId}_${t.code}`, {
      companyId,
      code: t.code,
      name: t.name,
      type: t.type,
      normalSide: t.normalSide,
      systemKey: t.systemKey || '',
      balanceMinor: 0,
      isActive: true
    });
  }

  console.log('\n✨ Initial company and 21 accounts seeded in Appwrite Cloud!');
}

run().catch(console.error);
