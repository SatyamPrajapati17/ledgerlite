export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';
export type NormalSide = 'debit' | 'credit';
export type JournalSource = 'manual' | 'invoice' | 'payment' | 'bill' | 'reversal' | 'seed';
export type ContactKind = 'customer' | 'vendor';
export type InvoiceKind = 'sales' | 'purchase';
export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'void';
export type PaymentMethod = 'cash' | 'bank' | 'upi' | 'card' | 'other';

export interface Company {
  $id: string;
  name: string;
  legalName?: string;
  currency: string; // 'INR' | 'USD' | 'EUR' | 'GBP'
  fiscalYearStartMonth: number; // 1-12
  taxLabel?: string; // 'GST' | 'VAT' | 'Sales Tax'
  ownerId: string;
  $createdAt?: string;
}

export interface Account {
  $id: string;
  companyId: string;
  code: string;
  name: string;
  type: AccountType;
  normalSide: NormalSide;
  systemKey?: string; // 'cash' | 'bank' | 'ar' | 'ap' | 'tax_payable' | 'revenue' | 'expense_default'
  balanceMinor: number; // stored as integer in minor units (paise/cents)
  isActive: boolean;
  $createdAt?: string;
}

export interface JournalLine {
  $id?: string;
  companyId: string;
  entryId: string;
  lineNo: number;
  entryDate: string; // ISO date
  accountId: string;
  debitMinor: number; // integer
  creditMinor: number; // integer
  description?: string;
}

export interface JournalEntry {
  $id: string;
  companyId: string;
  entryNo: number;
  entryDate: string; // ISO date
  memo?: string;
  source: JournalSource;
  sourceId?: string;
  reversalOfId?: string;
  totalMinor: number; // sum of debits
  createdBy: string;
  $createdAt?: string;
  lines?: JournalLine[];
}

export interface Contact {
  $id: string;
  companyId: string;
  kind: ContactKind;
  name: string;
  email?: string;
  phone?: string;
  taxId?: string;
  $createdAt?: string;
}

export interface InvoiceItem {
  $id?: string;
  companyId: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPriceMinor: number;
  taxRateBp: number; // e.g. 1800 = 18.00%
  lineSubtotalMinor: number;
  accountId: string;
}

export interface Invoice {
  $id: string;
  companyId: string;
  kind: InvoiceKind;
  number: string;
  contactId: string;
  contactName?: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
  paidMinor: number;
  entryId?: string;
  items?: InvoiceItem[];
  $createdAt?: string;
}

export interface Payment {
  $id: string;
  companyId: string;
  invoiceId: string;
  invoiceNumber?: string;
  paymentDate: string;
  amountMinor: number;
  method: PaymentMethod;
  cashAccountId: string;
  cashAccountName?: string;
  entryId: string;
  reference?: string;
  $createdAt?: string;
}

export interface Counter {
  $id: string;
  companyId: string;
  counterKey: 'entry' | 'invoice';
  value: number;
}

export interface AuditLogItem {
  $id: string;
  companyId: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  $createdAt: string;
}
