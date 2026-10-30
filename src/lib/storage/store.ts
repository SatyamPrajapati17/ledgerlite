'use client';

import { Company, Account, JournalEntry, JournalLine, Contact, Invoice, InvoiceItem, Payment, AuditLogItem } from '../types';
import { generateFullSeedDataset, generateTemplateAccounts } from '../seed';
import { isAppwriteConfigured, tablesDB, DATABASE_ID } from '../appwrite/config';
import { validateJournalEntry } from '../ledger/validate';

const STORAGE_KEY = 'ledgerlite_store_v1';

interface LedgerState {
  company: Company | null;
  accounts: Account[];
  entries: JournalEntry[];
  lines: JournalLine[];
  contacts: Contact[];
  invoices: Invoice[];
  payments: Payment[];
  auditLogs: AuditLogItem[];
  counterEntry: number;
  counterInvoice: number;
}

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(cb => {
    try { cb(); } catch (err) { console.error('Listener notification error:', err); }
  });
}

const DEFAULT_COMPANY: Company = {
  $id: 'team_apex_global',
  name: 'Apex Global Inc',
  legalName: 'Apex Global Technologies Pvt. Ltd.',
  currency: 'INR',
  fiscalYearStartMonth: 4, // April
  taxLabel: 'GST',
  ownerId: 'user_founder',
  $createdAt: '2026-10-01T00:00:00Z',
};

function getInitialState(): LedgerState {
  if (typeof window === 'undefined') {
    const seed = generateFullSeedDataset(DEFAULT_COMPANY.$id);
    return {
      company: DEFAULT_COMPANY,
      accounts: seed.accounts,
      entries: seed.entries,
      lines: seed.lines,
      contacts: seed.contacts,
      invoices: seed.invoices,
      payments: seed.payments,
      auditLogs: seed.auditLogs,
      counterEntry: 10,
      counterInvoice: 5,
    };
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.company && parsed.accounts?.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read from localStorage, using fresh seed data', err);
  }

  const seed = generateFullSeedDataset(DEFAULT_COMPANY.$id);
  const initialState: LedgerState = {
    company: DEFAULT_COMPANY,
    accounts: seed.accounts,
    entries: seed.entries,
    lines: seed.lines,
    contacts: seed.contacts,
    invoices: seed.invoices,
    payments: seed.payments,
    auditLogs: seed.auditLogs,
    counterEntry: 10,
    counterInvoice: 5,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
  } catch {}

  return initialState;
}

let state: LedgerState = getInitialState();

function persistState() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }
  notify();
}

export const LedgerStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getState(): LedgerState {
    return state;
  },

  getCompany(): Company {
    if (!state.company) {
      state.company = DEFAULT_COMPANY;
      persistState();
    }
    return state.company;
  },

  updateCompany(updates: Partial<Company>) {
    state.company = { ...state.company!, ...updates };
    state.auditLogs.unshift({
      $id: `audit_${Date.now()}`,
      companyId: state.company.$id,
      actorId: 'user_founder',
      actorName: 'Admin',
      action: 'company.updated',
      entityType: 'company',
      entityId: state.company.$id,
      summary: `Updated company profile details`,
      $createdAt: new Date().toISOString(),
    });
    persistState();
    return state.company;
  },

  getAccounts(): Account[] {
    return state.accounts;
  },

  getAccountById(id: string): Account | undefined {
    return state.accounts.find(a => a.$id === id);
  },

  addAccount(accountData: Omit<Account, '$id' | 'balanceMinor'>): Account {
    const existing = state.accounts.find(
      a => a.code === accountData.code && a.companyId === accountData.companyId
    );
    if (existing) {
      throw new Error(`Account code ${accountData.code} already exists.`);
    }

    const newAccount: Account = {
      ...accountData,
      $id: `acc_${accountData.companyId}_${accountData.code}`,
      balanceMinor: 0,
      $createdAt: new Date().toISOString(),
    };

    state.accounts.push(newAccount);
    state.auditLogs.unshift({
      $id: `audit_${Date.now()}`,
      companyId: accountData.companyId,
      actorId: 'user_founder',
      actorName: 'Accountant',
      action: 'account.created',
      entityType: 'account',
      entityId: newAccount.$id,
      summary: `Created account ${newAccount.code} - ${newAccount.name} (${newAccount.type})`,
      $createdAt: new Date().toISOString(),
    });

    persistState();
    return newAccount;
  },

  toggleAccountActive(id: string): Account {
    const acct = state.accounts.find(a => a.$id === id);
    if (!acct) throw new Error('Account not found');
    acct.isActive = !acct.isActive;

    state.auditLogs.unshift({
      $id: `audit_${Date.now()}`,
      companyId: acct.companyId,
      actorId: 'user_founder',
      actorName: 'Accountant',
      action: 'account.status_changed',
      entityType: 'account',
      entityId: acct.$id,
      summary: `${acct.isActive ? 'Activated' : 'Deactivated'} account ${acct.code} - ${acct.name}`,
      $createdAt: new Date().toISOString(),
    });

    persistState();
    return acct;
  },

  getEntries(): JournalEntry[] {
    return state.entries;
  },

  getEntryById(id: string): JournalEntry | undefined {
    return state.entries.find(e => e.$id === id);
  },

  getLines(): JournalLine[] {
    return state.lines;
  },

  getLinesForEntry(entryId: string): JournalLine[] {
    return state.lines.filter(l => l.entryId === entryId);
  },

  /**
   * Posts a journal entry atomically.
   * Updates lines, computes totalMinor, increments/decrements account balanceMinor,
   * creates audit log item, and notifies all subscribers.
   */
  postJournalEntry(
    draft: {
      companyId: string;
      entryDate: string;
      memo?: string;
      source?: any;
      sourceId?: string;
      createdBy?: string;
      lines: { accountId: string; debitMinor: number; creditMinor: number; description?: string }[];
    }
  ): JournalEntry {
    const accountsMap = new Map(state.accounts.map(a => [a.$id, a]));
    const val = validateJournalEntry(draft as any, accountsMap);
    if (!val.valid) {
      throw new Error(val.errors.join('; '));
    }

    state.counterEntry += 1;
    const entryNo = state.counterEntry;
    const entryId = `entry_${draft.companyId}_${entryNo}_${Date.now()}`;
    const dateStr = draft.entryDate || new Date().toISOString();

    const createdLines: JournalLine[] = draft.lines.map((l, index) => {
      const acct = accountsMap.get(l.accountId)!;
      // Net change: debit increases balance, credit decreases balance
      acct.balanceMinor += (l.debitMinor - l.creditMinor);

      return {
        $id: `line_${entryId}_${index + 1}`,
        companyId: draft.companyId,
        entryId,
        lineNo: index + 1,
        entryDate: dateStr,
        accountId: l.accountId,
        debitMinor: l.debitMinor,
        creditMinor: l.creditMinor,
        description: l.description || draft.memo,
      };
    });

    const newEntry: JournalEntry = {
      $id: entryId,
      companyId: draft.companyId,
      entryNo,
      entryDate: dateStr,
      memo: draft.memo || `Journal Entry #${entryNo}`,
      source: draft.source || 'manual',
      sourceId: draft.sourceId,
      totalMinor: val.totalDebitMinor,
      createdBy: draft.createdBy || 'Satyam (Owner)',
      $createdAt: new Date().toISOString(),
      lines: createdLines,
    };

    state.entries.unshift(newEntry);
    state.lines.push(...createdLines);

    state.auditLogs.unshift({
      $id: `audit_${entryId}`,
      companyId: draft.companyId,
      actorId: 'user_founder',
      actorName: draft.createdBy || 'Satyam (Owner)',
      action: 'entry.posted',
      entityType: 'journalEntry',
      entityId: entryId,
      summary: `Posted Journal Entry #${entryNo}: ${newEntry.memo} [₹${(val.totalDebitMinor / 100).toFixed(2)}]`,
      $createdAt: new Date().toISOString(),
    });

    persistState();
    return newEntry;
  },

  /**
   * Voids an entry by creating a reversal entry with swapped debits & credits.
   * Original entry is never deleted (immutable history).
   */
  voidJournalEntry(entryId: string, reason: string = 'Correction reversal'): JournalEntry {
    const original = state.entries.find(e => e.$id === entryId);
    if (!original) throw new Error('Original entry not found');

    const originalLines = state.lines.filter(l => l.entryId === entryId);
    if (originalLines.length === 0) throw new Error('Original entry lines not found');

    // Create opposite lines: debits become credits, credits become debits
    const reversedLines = originalLines.map(l => ({
      accountId: l.accountId,
      debitMinor: l.creditMinor,
      creditMinor: l.debitMinor,
      description: `Reversal of #${original.entryNo}: ${l.description || ''}`,
    }));

    state.counterEntry += 1;
    const revEntryNo = state.counterEntry;
    const revEntryId = `entry_${original.companyId}_${revEntryNo}_rev`;

    const accountsMap = new Map(state.accounts.map(a => [a.$id, a]));

    const createdRevLines: JournalLine[] = reversedLines.map((l, index) => {
      const acct = accountsMap.get(l.accountId)!;
      acct.balanceMinor += (l.debitMinor - l.creditMinor);

      return {
        $id: `line_${revEntryId}_${index + 1}`,
        companyId: original.companyId,
        entryId: revEntryId,
        lineNo: index + 1,
        entryDate: new Date().toISOString(),
        accountId: l.accountId,
        debitMinor: l.debitMinor,
        creditMinor: l.creditMinor,
        description: l.description,
      };
    });

    const reversalEntry: JournalEntry = {
      $id: revEntryId,
      companyId: original.companyId,
      entryNo: revEntryNo,
      entryDate: new Date().toISOString(),
      memo: `VOID / REVERSAL of #${original.entryNo} (${reason})`,
      source: 'reversal',
      reversalOfId: original.$id,
      totalMinor: original.totalMinor,
      createdBy: 'Satyam (Owner)',
      $createdAt: new Date().toISOString(),
      lines: createdRevLines,
    };

    original.reversalOfId = revEntryId; // marks original as voided

    state.entries.unshift(reversalEntry);
    state.lines.push(...createdRevLines);

    state.auditLogs.unshift({
      $id: `audit_${revEntryId}`,
      companyId: original.companyId,
      actorId: 'user_founder',
      actorName: 'Satyam (Owner)',
      action: 'entry.voided',
      entityType: 'journalEntry',
      entityId: original.$id,
      summary: `Voided Entry #${original.entryNo} via Reversal Entry #${revEntryNo} (${reason})`,
      $createdAt: new Date().toISOString(),
    });

    persistState();
    return reversalEntry;
  },

  getInvoices(): Invoice[] {
    return state.invoices;
  },

  getInvoiceById(id: string): Invoice | undefined {
    return state.invoices.find(i => i.$id === id);
  },

  createAndPostInvoice(data: {
    companyId: string;
    contactId: string;
    issueDate: string;
    dueDate: string;
    items: { description: string; quantity: number; unitPriceMinor: number; taxRateBp: number; accountId?: string }[];
  }): Invoice {
    const contact = state.contacts.find(c => c.$id === data.contactId);
    if (!contact) throw new Error('Customer contact not found');

    const arAccount = state.accounts.find(a => a.systemKey === 'ar') || state.accounts.find(a => a.code === '1100');
    const revenueAccount = state.accounts.find(a => a.systemKey === 'revenue') || state.accounts.find(a => a.code === '4000');
    const taxAccount = state.accounts.find(a => a.systemKey === 'tax_payable') || state.accounts.find(a => a.code === '2100');

    if (!arAccount || !revenueAccount || !taxAccount) {
      throw new Error('Required accounting templates missing (AR, Revenue, or Tax Payable)');
    }

    let subtotalMinor = 0;
    let taxMinor = 0;

    data.items.forEach(item => {
      const lineSub = Math.round(item.quantity * item.unitPriceMinor);
      const lineTax = Math.round((lineSub * item.taxRateBp) / 10000);
      subtotalMinor += lineSub;
      taxMinor += lineTax;
    });

    const totalMinor = subtotalMinor + taxMinor;

    state.counterInvoice += 1;
    const invNumber = `INV-${String(state.counterInvoice).padStart(4, '0')}`;
    const invId = `inv_${data.companyId}_${Date.now()}`;

    // Auto-post matching Journal Entry:
    // Debit AR (total)
    // Credit Revenue (subtotal)
    // Credit Tax Payable (tax)
    const journalLines = [
      {
        accountId: arAccount.$id,
        debitMinor: totalMinor,
        creditMinor: 0,
        description: `Invoice ${invNumber} - ${contact.name}`,
      },
      {
        accountId: revenueAccount.$id,
        debitMinor: 0,
        creditMinor: subtotalMinor,
        description: `Sales Revenue from ${invNumber}`,
      },
    ];

    if (taxMinor > 0) {
      journalLines.push({
        accountId: taxAccount.$id,
        debitMinor: 0,
        creditMinor: taxMinor,
        description: `Output GST on ${invNumber}`,
      });
    }

    const postedEntry = this.postJournalEntry({
      companyId: data.companyId,
      entryDate: data.issueDate,
      memo: `Sales Invoice ${invNumber} [${contact.name}]`,
      source: 'invoice',
      sourceId: invId,
      lines: journalLines,
    });

    const newInvoice: Invoice = {
      $id: invId,
      companyId: data.companyId,
      kind: 'sales',
      number: invNumber,
      contactId: contact.$id,
      contactName: contact.name,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      status: 'sent',
      subtotalMinor,
      taxMinor,
      totalMinor,
      paidMinor: 0,
      entryId: postedEntry.$id,
      items: data.items.map((it, idx) => ({
        companyId: data.companyId,
        invoiceId: invId,
        description: it.description,
        quantity: it.quantity,
        unitPriceMinor: it.unitPriceMinor,
        taxRateBp: it.taxRateBp,
        lineSubtotalMinor: Math.round(it.quantity * it.unitPriceMinor),
        accountId: it.accountId || revenueAccount.$id,
      })),
      $createdAt: new Date().toISOString(),
    };

    state.invoices.unshift(newInvoice);

    state.auditLogs.unshift({
      $id: `audit_${invId}`,
      companyId: data.companyId,
      actorId: 'user_founder',
      actorName: 'Satyam (Owner)',
      action: 'invoice.created',
      entityType: 'invoice',
      entityId: invId,
      summary: `Created and posted Invoice ${invNumber} for ${contact.name} [₹${(totalMinor / 100).toFixed(2)}]`,
      $createdAt: new Date().toISOString(),
    });

    persistState();
    return newInvoice;
  },

  recordPayment(data: {
    invoiceId: string;
    paymentDate: string;
    amountMinor: number;
    method: any;
    cashAccountId: string;
    reference?: string;
  }): Payment {
    const inv = state.invoices.find(i => i.$id === data.invoiceId);
    if (!inv) throw new Error('Invoice not found');

    const remainingOwed = inv.totalMinor - inv.paidMinor;
    if (data.amountMinor > remainingOwed) {
      throw new Error(`Payment (₹${(data.amountMinor / 100).toFixed(2)}) exceeds remaining balance (₹${(remainingOwed / 100).toFixed(2)})`);
    }

    const arAccount = state.accounts.find(a => a.systemKey === 'ar') || state.accounts.find(a => a.code === '1100');
    const cashAcct = state.accounts.find(a => a.$id === data.cashAccountId);
    if (!arAccount || !cashAcct) throw new Error('Cash or AR account not found');

    const payId = `pay_${inv.companyId}_${Date.now()}`;

    // Auto-post matching Journal Entry:
    // Debit Bank/Cash (amount)
    // Credit Accounts Receivable (amount)
    const postedEntry = this.postJournalEntry({
      companyId: inv.companyId,
      entryDate: data.paymentDate,
      memo: `Payment for ${inv.number} [${inv.contactName}]`,
      source: 'payment',
      sourceId: payId,
      lines: [
        {
          accountId: cashAcct.$id,
          debitMinor: data.amountMinor,
          creditMinor: 0,
          description: `Payment received in ${cashAcct.name}`,
        },
        {
          accountId: arAccount.$id,
          debitMinor: 0,
          creditMinor: data.amountMinor,
          description: `Settlement against ${inv.number}`,
        },
      ],
    });

    inv.paidMinor += data.amountMinor;
    inv.status = inv.paidMinor >= inv.totalMinor ? 'paid' : 'partial';

    const payment: Payment = {
      $id: payId,
      companyId: inv.companyId,
      invoiceId: inv.$id,
      invoiceNumber: inv.number,
      paymentDate: data.paymentDate,
      amountMinor: data.amountMinor,
      method: data.method,
      cashAccountId: cashAcct.$id,
      cashAccountName: cashAcct.name,
      entryId: postedEntry.$id,
      reference: data.reference,
      $createdAt: new Date().toISOString(),
    };

    state.payments.unshift(payment);

    state.auditLogs.unshift({
      $id: `audit_${payId}`,
      companyId: inv.companyId,
      actorId: 'user_founder',
      actorName: 'Satyam (Owner)',
      action: 'payment.recorded',
      entityType: 'payment',
      entityId: payId,
      summary: `Recorded Payment for ${inv.number}: ₹${(data.amountMinor / 100).toFixed(2)} via ${data.method}`,
      $createdAt: new Date().toISOString(),
    });

    persistState();
    return payment;
  },

  getContacts(): Contact[] {
    return state.contacts;
  },

  createContact(data: Omit<Contact, '$id' | '$createdAt'>): Contact {
    const contact: Contact = {
      ...data,
      $id: `ct_${Date.now()}`,
      $createdAt: new Date().toISOString(),
    };
    state.contacts.push(contact);

    state.auditLogs.unshift({
      $id: `audit_${contact.$id}`,
      companyId: data.companyId,
      actorId: 'user_founder',
      actorName: 'Satyam (Owner)',
      action: 'contact.created',
      entityType: 'contact',
      entityId: contact.$id,
      summary: `Created contact ${contact.name} (${contact.kind})`,
      $createdAt: new Date().toISOString(),
    });

    persistState();
    return contact;
  },

  getAuditLogs(): AuditLogItem[] {
    return state.auditLogs;
  },

  resetAndSeed(companyId?: string) {
    const targetId = companyId || state.company?.$id || DEFAULT_COMPANY.$id;
    const seed = generateFullSeedDataset(targetId);
    state = {
      company: { ...DEFAULT_COMPANY, $id: targetId },
      accounts: seed.accounts,
      entries: seed.entries,
      lines: seed.lines,
      contacts: seed.contacts,
      invoices: seed.invoices,
      payments: seed.payments,
      auditLogs: seed.auditLogs,
      counterEntry: 15,
      counterInvoice: 8,
    };
    persistState();
  },

  loadTemplateAccountsOnly(companyId: string) {
    const tpls = generateTemplateAccounts(companyId);
    state.accounts = tpls;
    state.auditLogs.unshift({
      $id: `audit_${Date.now()}`,
      companyId,
      actorId: 'user_founder',
      actorName: 'Satyam (Owner)',
      action: 'template.loaded',
      entityType: 'accounts',
      entityId: companyId,
      summary: `Loaded 21 standard chart of accounts templates in one click`,
      $createdAt: new Date().toISOString(),
    });
    persistState();
  }
};
