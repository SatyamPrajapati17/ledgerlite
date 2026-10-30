const { Client, TablesDB, Permission, Role } = require('node-appwrite');
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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function safeCreate(fn, desc) {
  try {
    const res = await fn();
    console.log(`✓ ${desc}`);
    await sleep(350);
    return res;
  } catch (err) {
    if (err.message && (err.message.includes('already exists') || err.code === 409)) {
      console.log(`- ${desc} (already exists)`);
    } else {
      console.warn(`! ${desc} error:`, err.message);
    }
    await sleep(200);
  }
}

async function deploy() {
  console.log(`Deploying 10 tables to Appwrite Database ${databaseId}...`);

  // 1. companies
  await safeCreate(() => tablesDB.createTable({ databaseId, tableId: 'companies', name: 'companies', permissions: [Permission.read(Role.any()), Permission.create(Role.any()), Permission.update(Role.any())] }), 'Table: companies');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'companies', key: 'name', size: 120, required: true }), 'companies.name');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'companies', key: 'legalName', size: 160, required: false }), 'companies.legalName');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'companies', key: 'currency', size: 3, required: true, xdefault: 'INR' }), 'companies.currency');
  await safeCreate(() => tablesDB.createIntegerColumn({ databaseId, tableId: 'companies', key: 'fiscalYearStartMonth', required: true, xdefault: 1 }), 'companies.fiscalYearStartMonth');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'companies', key: 'taxLabel', size: 20, required: false, xdefault: 'GST' }), 'companies.taxLabel');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'companies', key: 'ownerId', size: 36, required: true }), 'companies.ownerId');

  // 2. accounts
  await safeCreate(() => tablesDB.createTable({ databaseId, tableId: 'accounts', name: 'accounts', permissions: [Permission.read(Role.any()), Permission.create(Role.any()), Permission.update(Role.any())] }), 'Table: accounts');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'accounts', key: 'companyId', size: 36, required: true }), 'accounts.companyId');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'accounts', key: 'code', size: 10, required: true }), 'accounts.code');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'accounts', key: 'name', size: 120, required: true }), 'accounts.name');
  await safeCreate(() => tablesDB.createEnumColumn({ databaseId, tableId: 'accounts', key: 'type', elements: ['asset', 'liability', 'equity', 'income', 'expense'], required: true }), 'accounts.type');
  await safeCreate(() => tablesDB.createEnumColumn({ databaseId, tableId: 'accounts', key: 'normalSide', elements: ['debit', 'credit'], required: true }), 'accounts.normalSide');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'accounts', key: 'systemKey', size: 30, required: false }), 'accounts.systemKey');
  await safeCreate(() => tablesDB.createBigIntColumn({ databaseId, tableId: 'accounts', key: 'balanceMinor', required: true, xdefault: 0 }), 'accounts.balanceMinor');
  await safeCreate(() => tablesDB.createBooleanColumn({ databaseId, tableId: 'accounts', key: 'isActive', required: true, xdefault: true }), 'accounts.isActive');

  // 3. journalEntries
  await safeCreate(() => tablesDB.createTable({ databaseId, tableId: 'journalEntries', name: 'journalEntries', permissions: [Permission.read(Role.any()), Permission.create(Role.any()), Permission.update(Role.any())] }), 'Table: journalEntries');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'journalEntries', key: 'companyId', size: 36, required: true }), 'journalEntries.companyId');
  await safeCreate(() => tablesDB.createBigIntColumn({ databaseId, tableId: 'journalEntries', key: 'entryNo', required: true }), 'journalEntries.entryNo');
  await safeCreate(() => tablesDB.createDatetimeColumn({ databaseId, tableId: 'journalEntries', key: 'entryDate', required: true }), 'journalEntries.entryDate');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'journalEntries', key: 'memo', size: 500, required: false }), 'journalEntries.memo');
  await safeCreate(() => tablesDB.createEnumColumn({ databaseId, tableId: 'journalEntries', key: 'source', elements: ['manual', 'invoice', 'payment', 'bill', 'reversal', 'seed'], required: true }), 'journalEntries.source');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'journalEntries', key: 'sourceId', size: 36, required: false }), 'journalEntries.sourceId');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'journalEntries', key: 'reversalOfId', size: 36, required: false }), 'journalEntries.reversalOfId');
  await safeCreate(() => tablesDB.createBigIntColumn({ databaseId, tableId: 'journalEntries', key: 'totalMinor', required: true }), 'journalEntries.totalMinor');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'journalEntries', key: 'createdBy', size: 36, required: true }), 'journalEntries.createdBy');

  // 4. journalLines
  await safeCreate(() => tablesDB.createTable({ databaseId, tableId: 'journalLines', name: 'journalLines', permissions: [Permission.read(Role.any()), Permission.create(Role.any()), Permission.update(Role.any())] }), 'Table: journalLines');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'journalLines', key: 'companyId', size: 36, required: true }), 'journalLines.companyId');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'journalLines', key: 'entryId', size: 36, required: true }), 'journalLines.entryId');
  await safeCreate(() => tablesDB.createIntegerColumn({ databaseId, tableId: 'journalLines', key: 'lineNo', required: true }), 'journalLines.lineNo');
  await safeCreate(() => tablesDB.createDatetimeColumn({ databaseId, tableId: 'journalLines', key: 'entryDate', required: true }), 'journalLines.entryDate');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'journalLines', key: 'accountId', size: 36, required: true }), 'journalLines.accountId');
  await safeCreate(() => tablesDB.createBigIntColumn({ databaseId, tableId: 'journalLines', key: 'debitMinor', required: true, xdefault: 0 }), 'journalLines.debitMinor');
  await safeCreate(() => tablesDB.createBigIntColumn({ databaseId, tableId: 'journalLines', key: 'creditMinor', required: true, xdefault: 0 }), 'journalLines.creditMinor');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'journalLines', key: 'description', size: 200, required: false }), 'journalLines.description');

  // 5. contacts
  await safeCreate(() => tablesDB.createTable({ databaseId, tableId: 'contacts', name: 'contacts', permissions: [Permission.read(Role.any()), Permission.create(Role.any()), Permission.update(Role.any())] }), 'Table: contacts');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'contacts', key: 'companyId', size: 36, required: true }), 'contacts.companyId');
  await safeCreate(() => tablesDB.createEnumColumn({ databaseId, tableId: 'contacts', key: 'kind', elements: ['customer', 'vendor'], required: true }), 'contacts.kind');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'contacts', key: 'name', size: 120, required: true }), 'contacts.name');
  await safeCreate(() => tablesDB.createEmailColumn({ databaseId, tableId: 'contacts', key: 'email', required: false }), 'contacts.email');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'contacts', key: 'phone', size: 30, required: false }), 'contacts.phone');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'contacts', key: 'taxId', size: 30, required: false }), 'contacts.taxId');

  // 6. invoices
  await safeCreate(() => tablesDB.createTable({ databaseId, tableId: 'invoices', name: 'invoices', permissions: [Permission.read(Role.any()), Permission.create(Role.any()), Permission.update(Role.any())] }), 'Table: invoices');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'invoices', key: 'companyId', size: 36, required: true }), 'invoices.companyId');
  await safeCreate(() => tablesDB.createEnumColumn({ databaseId, tableId: 'invoices', key: 'kind', elements: ['sales', 'purchase'], required: true }), 'invoices.kind');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'invoices', key: 'number', size: 30, required: true }), 'invoices.number');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'invoices', key: 'contactId', size: 36, required: true }), 'invoices.contactId');
  await safeCreate(() => tablesDB.createDatetimeColumn({ databaseId, tableId: 'invoices', key: 'issueDate', required: true }), 'invoices.issueDate');
  await safeCreate(() => tablesDB.createDatetimeColumn({ databaseId, tableId: 'invoices', key: 'dueDate', required: true }), 'invoices.dueDate');
  await safeCreate(() => tablesDB.createEnumColumn({ databaseId, tableId: 'invoices', key: 'status', elements: ['draft', 'sent', 'partial', 'paid', 'void'], required: true }), 'invoices.status');
  await safeCreate(() => tablesDB.createBigIntColumn({ databaseId, tableId: 'invoices', key: 'subtotalMinor', required: true }), 'invoices.subtotalMinor');
  await safeCreate(() => tablesDB.createBigIntColumn({ databaseId, tableId: 'invoices', key: 'taxMinor', required: true }), 'invoices.taxMinor');
  await safeCreate(() => tablesDB.createBigIntColumn({ databaseId, tableId: 'invoices', key: 'totalMinor', required: true }), 'invoices.totalMinor');
  await safeCreate(() => tablesDB.createBigIntColumn({ databaseId, tableId: 'invoices', key: 'paidMinor', required: true, xdefault: 0 }), 'invoices.paidMinor');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'invoices', key: 'entryId', size: 36, required: false }), 'invoices.entryId');

  // 7. invoiceItems
  await safeCreate(() => tablesDB.createTable({ databaseId, tableId: 'invoiceItems', name: 'invoiceItems', permissions: [Permission.read(Role.any()), Permission.create(Role.any()), Permission.update(Role.any())] }), 'Table: invoiceItems');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'invoiceItems', key: 'companyId', size: 36, required: true }), 'invoiceItems.companyId');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'invoiceItems', key: 'invoiceId', size: 36, required: true }), 'invoiceItems.invoiceId');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'invoiceItems', key: 'description', size: 200, required: true }), 'invoiceItems.description');
  await safeCreate(() => tablesDB.createFloatColumn({ databaseId, tableId: 'invoiceItems', key: 'quantity', required: true }), 'invoiceItems.quantity');
  await safeCreate(() => tablesDB.createBigIntColumn({ databaseId, tableId: 'invoiceItems', key: 'unitPriceMinor', required: true }), 'invoiceItems.unitPriceMinor');
  await safeCreate(() => tablesDB.createIntegerColumn({ databaseId, tableId: 'invoiceItems', key: 'taxRateBp', required: true }), 'invoiceItems.taxRateBp');
  await safeCreate(() => tablesDB.createBigIntColumn({ databaseId, tableId: 'invoiceItems', key: 'lineSubtotalMinor', required: true }), 'invoiceItems.lineSubtotalMinor');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'invoiceItems', key: 'accountId', size: 36, required: true }), 'invoiceItems.accountId');

  // 8. payments
  await safeCreate(() => tablesDB.createTable({ databaseId, tableId: 'payments', name: 'payments', permissions: [Permission.read(Role.any()), Permission.create(Role.any()), Permission.update(Role.any())] }), 'Table: payments');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'payments', key: 'companyId', size: 36, required: true }), 'payments.companyId');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'payments', key: 'invoiceId', size: 36, required: true }), 'payments.invoiceId');
  await safeCreate(() => tablesDB.createDatetimeColumn({ databaseId, tableId: 'payments', key: 'paymentDate', required: true }), 'payments.paymentDate');
  await safeCreate(() => tablesDB.createBigIntColumn({ databaseId, tableId: 'payments', key: 'amountMinor', required: true }), 'payments.amountMinor');
  await safeCreate(() => tablesDB.createEnumColumn({ databaseId, tableId: 'payments', key: 'method', elements: ['cash', 'bank', 'upi', 'card', 'other'], required: true }), 'payments.method');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'payments', key: 'cashAccountId', size: 36, required: true }), 'payments.cashAccountId');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'payments', key: 'entryId', size: 36, required: true }), 'payments.entryId');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'payments', key: 'reference', size: 80, required: false }), 'payments.reference');

  // 9. counters
  await safeCreate(() => tablesDB.createTable({ databaseId, tableId: 'counters', name: 'counters', permissions: [Permission.read(Role.any()), Permission.create(Role.any()), Permission.update(Role.any())] }), 'Table: counters');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'counters', key: 'companyId', size: 36, required: true }), 'counters.companyId');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'counters', key: 'counterKey', size: 30, required: true }), 'counters.counterKey');
  await safeCreate(() => tablesDB.createBigIntColumn({ databaseId, tableId: 'counters', key: 'value', required: true, xdefault: 0 }), 'counters.value');

  // 10. auditLog
  await safeCreate(() => tablesDB.createTable({ databaseId, tableId: 'auditLog', name: 'auditLog', permissions: [Permission.read(Role.any()), Permission.create(Role.any()), Permission.update(Role.any())] }), 'Table: auditLog');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'auditLog', key: 'companyId', size: 36, required: true }), 'auditLog.companyId');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'auditLog', key: 'actorId', size: 36, required: true }), 'auditLog.actorId');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'auditLog', key: 'actorName', size: 80, required: true }), 'auditLog.actorName');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'auditLog', key: 'action', size: 40, required: true }), 'auditLog.action');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'auditLog', key: 'entityType', size: 30, required: true }), 'auditLog.entityType');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'auditLog', key: 'entityId', size: 36, required: true }), 'auditLog.entityId');
  await safeCreate(() => tablesDB.createVarcharColumn({ databaseId, tableId: 'auditLog', key: 'summary', size: 300, required: true }), 'auditLog.summary');

  console.log('\n✨ All 10 Tables and Columns successfully deployed to Appwrite TablesDB!');
}

deploy().catch(err => {
  console.error('Deployment fatal error:', err);
});
