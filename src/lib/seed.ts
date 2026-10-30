import { Account, Contact, Invoice, JournalEntry, JournalLine, Payment, AuditLogItem } from './types';

export const TEMPLATE_ACCOUNTS = [
  // Assets (Normal side: debit)
  { code: '1000', name: 'Cash on Hand', type: 'asset', normalSide: 'debit', systemKey: 'cash' },
  { code: '1010', name: 'Primary Bank Account', type: 'asset', normalSide: 'debit', systemKey: 'bank' },
  { code: '1100', name: 'Accounts Receivable', type: 'asset', normalSide: 'debit', systemKey: 'ar' },
  { code: '1500', name: 'Computers & Equipment', type: 'asset', normalSide: 'debit' },

  // Liabilities (Normal side: credit)
  { code: '2000', name: 'Accounts Payable', type: 'liability', normalSide: 'credit', systemKey: 'ap' },
  { code: '2100', name: 'Tax / GST Payable', type: 'liability', normalSide: 'credit', systemKey: 'tax_payable' },
  { code: '2500', name: 'Bank Business Loan', type: 'liability', normalSide: 'credit' },

  // Equity (Normal side: credit)
  { code: '3000', name: "Owner's Capital", type: 'equity', normalSide: 'credit' },
  { code: '3100', name: 'Retained Earnings', type: 'equity', normalSide: 'credit' },

  // Income (Normal side: credit)
  { code: '4000', name: 'Software Sales Revenue', type: 'income', normalSide: 'credit', systemKey: 'revenue' },
  { code: '4100', name: 'Consulting & Service Revenue', type: 'income', normalSide: 'credit' },
  { code: '4900', name: 'Other Income', type: 'income', normalSide: 'credit' },

  // Expenses (Normal side: debit)
  { code: '5000', name: 'Cost of Goods Sold', type: 'expense', normalSide: 'debit' },
  { code: '5100', name: 'Salaries & Wages', type: 'expense', normalSide: 'debit' },
  { code: '5200', name: 'Office Rent', type: 'expense', normalSide: 'debit' },
  { code: '5300', name: 'Utilities & Internet', type: 'expense', normalSide: 'debit' },
  { code: '5400', name: 'Software & Cloud Services', type: 'expense', normalSide: 'debit' },
  { code: '5500', name: 'Marketing & Ads', type: 'expense', normalSide: 'debit' },
  { code: '5600', name: 'Office Supplies & Stationery', type: 'expense', normalSide: 'debit' },
  { code: '5700', name: 'Bank Charges & Fees', type: 'expense', normalSide: 'debit' },
  { code: '5900', name: 'Miscellaneous Expenses', type: 'expense', normalSide: 'debit', systemKey: 'expense_default' },
] as const;

export function generateTemplateAccounts(companyId: string): Account[] {
  return TEMPLATE_ACCOUNTS.map((tpl: any) => ({
    $id: `acc_${companyId}_${tpl.code}`,
    companyId,
    code: tpl.code,
    name: tpl.name,
    type: tpl.type as any,
    normalSide: tpl.normalSide as any,
    systemKey: tpl.systemKey,
    balanceMinor: 0,
    isActive: true,
  }));
}

export function generateFullSeedDataset(companyId: string) {
  const accounts = generateTemplateAccounts(companyId);
  const accMap = new Map<string, Account>(accounts.map(a => [a.code, a]));

  const contacts: Contact[] = [
    { $id: `ct_1`, companyId, kind: 'customer', name: 'Apex Innovations Pvt Ltd', email: 'billing@apexinno.io', phone: '+91 98765 43210', taxId: 'GSTIN27AAACA1234A1Z1' },
    { $id: `ct_2`, companyId, kind: 'customer', name: 'BluePeak Digital Labs', email: 'accounts@bluepeak.tech', phone: '+91 98111 22334', taxId: 'GSTIN29BBBBA5678B1Z2' },
    { $id: `ct_3`, companyId, kind: 'customer', name: 'Nexus Cloud Systems', email: 'invoices@nexuscloud.co', phone: '+91 99000 88776', taxId: 'GSTIN33CCCCA9012C1Z3' },
    { $id: `ct_4`, companyId, kind: 'vendor', name: 'CyberTower Realty Co.', email: 'admin@cybertower.space', phone: '+91 22 2840 9000' },
    { $id: `ct_5`, companyId, kind: 'vendor', name: 'Vanguard Internet Services', email: 'support@vanguardnet.in', phone: '+91 22 4000 1122' },
  ];

  const entries: JournalEntry[] = [];
  const lines: JournalLine[] = [];
  const invoices: Invoice[] = [];
  const payments: Payment[] = [];
  const auditLogs: AuditLogItem[] = [];

  let entryCounter = 1;

  // Helper to post a balanced entry and update cached balanceMinor
  function postEntry(
    dateStr: string,
    memo: string,
    source: any,
    rawLines: { code: string; debit: number; credit: number; desc?: string }[],
    sourceId?: string
  ): JournalEntry {
    const entryId = `entry_${companyId}_${entryCounter}`;
    const totalMinor = rawLines.reduce((sum, l) => sum + l.debit, 0);

    const entryLines: JournalLine[] = rawLines.map((rl, idx) => {
      const acct = accMap.get(rl.code)!;
      // Balance minor: sign rule: total debits minus total credits
      acct.balanceMinor += (rl.debit - rl.credit);

      return {
        $id: `line_${entryId}_${idx + 1}`,
        companyId,
        entryId,
        lineNo: idx + 1,
        entryDate: dateStr,
        accountId: acct.$id,
        debitMinor: rl.debit,
        creditMinor: rl.credit,
        description: rl.desc || memo,
      };
    });

    const entry: JournalEntry = {
      $id: entryId,
      companyId,
      entryNo: entryCounter++,
      entryDate: dateStr,
      memo,
      source,
      sourceId,
      totalMinor,
      createdBy: 'user_founder',
      $createdAt: dateStr,
      lines: entryLines,
    };

    entries.push(entry);
    lines.push(...entryLines);

    auditLogs.push({
      $id: `audit_${entryId}`,
      companyId,
      actorId: 'user_founder',
      actorName: 'Satyam (Owner)',
      action: 'entry.posted',
      entityType: 'journalEntry',
      entityId: entryId,
      summary: `Posted Journal Entry #${entry.entryNo}: ${memo} [${(totalMinor / 100).toFixed(2)}]`,
      $createdAt: dateStr,
    });

    return entry;
  }

  // Transaction 1: Owner injects capital (₹10,00,000)
  postEntry('2026-10-01T09:00:00Z', "Initial founder capital infusion", 'seed', [
    { code: '1010', debit: 100000000, credit: 0, desc: 'Deposit into Primary Bank' },
    { code: '3000', debit: 0, credit: 100000000, desc: "Owner Capital - Equity" },
  ]);

  // Transaction 2: Transfer Cash from Bank for Petty Cash (₹50,000)
  postEntry('2026-10-02T10:30:00Z', "Withdraw cash for office float", 'manual', [
    { code: '1000', debit: 5000000, credit: 0, desc: 'Petty cash on hand' },
    { code: '1010', debit: 0, credit: 5000000, desc: 'ATM withdrawal from bank' },
  ]);

  // Transaction 3: Purchase Computer Equipment (₹1,80,000)
  postEntry('2026-10-03T14:15:00Z', "MacBook Pros & monitors for engineering team", 'manual', [
    { code: '1500', debit: 18000000, credit: 0, desc: 'Hardware purchase' },
    { code: '1010', debit: 0, credit: 18000000, desc: 'Bank wire transfer' },
  ]);

  // Transaction 4: Office Rent October (₹45,000)
  postEntry('2026-10-05T11:00:00Z', "October Office Rent - CyberTower Realty", 'manual', [
    { code: '5200', debit: 4500000, credit: 0, desc: 'Office space lease' },
    { code: '1010', debit: 0, credit: 4500000, desc: 'Bank transfer to landlord' },
  ]);

  // Transaction 5: Cloud Infrastructure & Subscriptions (₹28,500)
  postEntry('2026-10-07T16:00:00Z', "AWS Cloud Hosting and GitHub Enterprise", 'manual', [
    { code: '5400', debit: 2850000, credit: 0, desc: 'Cloud infrastructure billing' },
    { code: '1010', debit: 0, credit: 2850000, desc: 'Corporate debit card' },
  ]);

  // Helper for creating and posting Invoice
  let invoiceCounter = 1;
  function createAndPostInvoice(
    contact: Contact,
    issueDate: string,
    dueDate: string,
    subtotal: number,
    taxRateBp: number = 1800,
    itemDesc: string = "Enterprise SaaS Platform License - Annual"
  ): Invoice {
    const invId = `inv_${companyId}_${invoiceCounter}`;
    const invNumber = `INV-${String(invoiceCounter++).padStart(4, '0')}`;
    const tax = Math.round((subtotal * taxRateBp) / 10000);
    const total = subtotal + tax;

    // Post journal entry for invoice:
    // Debit AR (total)
    // Credit Revenue (subtotal)
    // Credit Tax Payable (tax)
    const entry = postEntry(
      issueDate,
      `Invoice ${invNumber} to ${contact.name}`,
      'invoice',
      [
        { code: '1100', debit: total, credit: 0, desc: `Accounts Receivable - ${contact.name}` },
        { code: '4000', debit: 0, credit: subtotal, desc: itemDesc },
        { code: '2100', debit: 0, credit: tax, desc: `GST Output Tax (${(taxRateBp / 100).toFixed(0)}%)` },
      ],
      invId
    );

    const inv: Invoice = {
      $id: invId,
      companyId,
      kind: 'sales',
      number: invNumber,
      contactId: contact.$id,
      contactName: contact.name,
      issueDate,
      dueDate,
      status: 'sent',
      subtotalMinor: subtotal,
      taxMinor: tax,
      totalMinor: total,
      paidMinor: 0,
      entryId: entry.$id,
      items: [
        {
          companyId,
          invoiceId: invId,
          description: itemDesc,
          quantity: 1,
          unitPriceMinor: subtotal,
          taxRateBp,
          lineSubtotalMinor: subtotal,
          accountId: accMap.get('4000')!.$id,
        }
      ],
      $createdAt: issueDate,
    };

    invoices.push(inv);

    auditLogs.push({
      $id: `audit_${invId}`,
      companyId,
      actorId: 'user_founder',
      actorName: 'Satyam (Owner)',
      action: 'invoice.created',
      entityType: 'invoice',
      entityId: invId,
      summary: `Created and posted Invoice ${invNumber} for ${contact.name} [₹${(total / 100).toFixed(2)}]`,
      $createdAt: issueDate,
    });

    return inv;
  }

  // Invoice 1: Apex Innovations (₹3,50,000 + 18% GST = ₹4,13,000)
  const inv1 = createAndPostInvoice(contacts[0], '2026-10-10T10:00:00Z', '2026-10-25T18:00:00Z', 35000000);

  // Invoice 2: BluePeak Digital Labs (₹2,20,000 + 18% GST = ₹2,59,600)
  const inv2 = createAndPostInvoice(contacts[1], '2026-10-14T11:30:00Z', '2026-10-29T18:00:00Z', 22000000);

  // Invoice 3: Nexus Cloud Systems (₹1,50,000 + 18% GST = ₹1,77,000)
  const inv3 = createAndPostInvoice(contacts[2], '2026-10-20T15:00:00Z', '2026-11-05T18:00:00Z', 15000000);

  // Payment 1: Full settlement of Invoice 1 via Bank (₹4,13,000)
  function recordPayment(inv: Invoice, paymentDate: string, amount: number, method: any = 'bank', cashCode: string = '1010'): Payment {
    const payId = `pay_${companyId}_${payments.length + 1}`;
    
    // Journal entry: Debit Bank, Credit Accounts Receivable
    const entry = postEntry(
      paymentDate,
      `Payment received for ${inv.number} from ${inv.contactName}`,
      'payment',
      [
        { code: cashCode, debit: amount, credit: 0, desc: `Funds credited to ${accMap.get(cashCode)!.name}` },
        { code: '1100', debit: 0, credit: amount, desc: `Clear Accounts Receivable - ${inv.number}` },
      ],
      payId
    );

    inv.paidMinor += amount;
    inv.status = inv.paidMinor >= inv.totalMinor ? 'paid' : 'partial';

    const payment: Payment = {
      $id: payId,
      companyId,
      invoiceId: inv.$id,
      invoiceNumber: inv.number,
      paymentDate,
      amountMinor: amount,
      method,
      cashAccountId: accMap.get(cashCode)!.$id,
      cashAccountName: accMap.get(cashCode)!.name,
      entryId: entry.$id,
      reference: `NEFT-REF-${Math.floor(100000 + Math.random() * 900000)}`,
      $createdAt: paymentDate,
    };

    payments.push(payment);

    auditLogs.push({
      $id: `audit_${payId}`,
      companyId,
      actorId: 'user_founder',
      actorName: 'Satyam (Owner)',
      action: 'payment.recorded',
      entityType: 'payment',
      entityId: payId,
      summary: `Recorded Payment for ${inv.number}: ₹${(amount / 100).toFixed(2)} via ${method}`,
      $createdAt: paymentDate,
    });

    return payment;
  }

  recordPayment(inv1, '2026-10-18T14:00:00Z', inv1.totalMinor, 'bank', '1010');

  // Payment 2: Partial payment on Invoice 2 (₹1,50,000)
  recordPayment(inv2, '2026-10-24T12:00:00Z', 15000000, 'bank', '1010');

  // Transaction 6: Marketing campaign expense (₹35,000)
  postEntry('2026-10-25T16:30:00Z', "Google Ads & LinkedIn Sponsored Posts", 'manual', [
    { code: '5500', debit: 3500000, credit: 0, desc: 'Digital marketing acquisition' },
    { code: '1010', debit: 0, credit: 3500000, desc: 'Online banking debit' },
  ]);

  // Transaction 7: Office stationery and team snacks (₹8,200) paid from Petty Cash
  postEntry('2026-10-27T17:45:00Z', "Whiteboard markers, stationery & pantry refreshments", 'manual', [
    { code: '5600', debit: 820000, credit: 0, desc: 'Stationery and pantry supplies' },
    { code: '1000', debit: 0, credit: 820000, desc: 'Paid from cash on hand' },
  ]);

  // Transaction 8: Salaries payout for October (₹2,20,000)
  postEntry('2026-10-30T18:00:00Z', "October Team Payroll & Salaries", 'manual', [
    { code: '5100', debit: 22000000, credit: 0, desc: 'Staff compensation' },
    { code: '1010', debit: 0, credit: 22000000, desc: 'Direct bank salary transfers' },
  ]);

  // Return the complete dataset
  return {
    accounts,
    contacts,
    entries: entries.reverse(), // most recent first for list view
    lines,
    invoices,
    payments,
    auditLogs: auditLogs.reverse(),
  };
}
