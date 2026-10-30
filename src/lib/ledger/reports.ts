import { Account, JournalLine, JournalEntry } from '../types';

export interface TrialBalanceRow {
  accountId: string;
  code: string;
  name: string;
  type: string;
  debitMinor: number;
  creditMinor: number;
}

export interface TrialBalanceReport {
  rows: TrialBalanceRow[];
  totalDebitMinor: number;
  totalCreditMinor: number;
  isBalanced: boolean;
  differenceMinor: number;
}

export interface ProfitAndLossReport {
  incomeRows: { code: string; name: string; amountMinor: number }[];
  expenseRows: { code: string; name: string; amountMinor: number }[];
  totalIncomeMinor: number;
  totalExpenseMinor: number;
  netProfitMinor: number;
}

export interface BalanceSheetReport {
  assetRows: { code: string; name: string; amountMinor: number }[];
  liabilityRows: { code: string; name: string; amountMinor: number }[];
  equityRows: { code: string; name: string; amountMinor: number }[];
  totalAssetsMinor: number;
  totalLiabilitiesMinor: number;
  totalEquityMinor: number;
  totalLiabilitiesAndEquityMinor: number;
  isBalanced: boolean;
}

export interface GeneralLedgerRow {
  entryDate: string;
  entryNo: number;
  memo: string;
  source: string;
  debitMinor: number;
  creditMinor: number;
  runningBalanceMinor: number;
}

export interface GeneralLedgerAccountReport {
  account: Account;
  rows: GeneralLedgerRow[];
  totalDebitMinor: number;
  totalCreditMinor: number;
  netBalanceMinor: number;
}

export interface IntegrityCheckItem {
  accountId: string;
  code: string;
  name: string;
  cachedBalanceMinor: number;
  rebuiltBalanceMinor: number;
  matches: boolean;
  differenceMinor: number;
}

export interface IntegrityCheckResult {
  allMatch: boolean;
  totalAccountsChecked: number;
  matchedCount: number;
  items: IntegrityCheckItem[];
}

export function generateTrialBalance(accounts: Account[]): TrialBalanceReport {
  let totalDebitMinor = 0;
  let totalCreditMinor = 0;

  const rows: TrialBalanceRow[] = accounts
    .filter(a => a.isActive)
    .sort((a, b) => a.code.localeCompare(b.code))
    .map(a => {
      // In LedgerLite, balanceMinor = total debits - total credits
      const bal = a.balanceMinor;
      let debit = 0;
      let credit = 0;

      if (bal > 0) {
        debit = bal;
      } else if (bal < 0) {
        credit = Math.abs(bal);
      }

      totalDebitMinor += debit;
      totalCreditMinor += credit;

      return {
        accountId: a.$id,
        code: a.code,
        name: a.name,
        type: a.type,
        debitMinor: debit,
        creditMinor: credit,
      };
    });

  const differenceMinor = totalDebitMinor - totalCreditMinor;

  return {
    rows,
    totalDebitMinor,
    totalCreditMinor,
    isBalanced: differenceMinor === 0,
    differenceMinor,
  };
}

export function generateProfitAndLoss(accounts: Account[]): ProfitAndLossReport {
  const incomeAccounts = accounts.filter(a => a.type === 'income' && a.isActive);
  const expenseAccounts = accounts.filter(a => a.type === 'expense' && a.isActive);

  // For Income: normal side is credit, so balanceMinor is usually <= 0 (debits - credits)
  // Display amount is positive
  const incomeRows = incomeAccounts
    .sort((a, b) => a.code.localeCompare(b.code))
    .map(a => ({
      code: a.code,
      name: a.name,
      amountMinor: Math.abs(a.balanceMinor),
    }));

  // For Expense: normal side is debit, so balanceMinor is usually >= 0
  const expenseRows = expenseAccounts
    .sort((a, b) => a.code.localeCompare(b.code))
    .map(a => ({
      code: a.code,
      name: a.name,
      amountMinor: a.balanceMinor,
    }));

  const totalIncomeMinor = incomeRows.reduce((sum, r) => sum + r.amountMinor, 0);
  const totalExpenseMinor = expenseRows.reduce((sum, r) => sum + r.amountMinor, 0);
  const netProfitMinor = totalIncomeMinor - totalExpenseMinor;

  return {
    incomeRows,
    expenseRows,
    totalIncomeMinor,
    totalExpenseMinor,
    netProfitMinor,
  };
}

export function generateBalanceSheet(accounts: Account[]): BalanceSheetReport {
  const assetAccounts = accounts.filter(a => a.type === 'asset' && a.isActive);
  const liabilityAccounts = accounts.filter(a => a.type === 'liability' && a.isActive);
  const equityAccounts = accounts.filter(a => a.type === 'equity' && a.isActive);

  const assetRows = assetAccounts
    .sort((a, b) => a.code.localeCompare(b.code))
    .map(a => ({
      code: a.code,
      name: a.name,
      amountMinor: a.balanceMinor,
    }));

  const liabilityRows = liabilityAccounts
    .sort((a, b) => a.code.localeCompare(b.code))
    .map(a => ({
      code: a.code,
      name: a.name,
      amountMinor: Math.abs(a.balanceMinor),
    }));

  const pnl = generateProfitAndLoss(accounts);

  const equityRows = equityAccounts
    .sort((a, b) => a.code.localeCompare(b.code))
    .map(a => ({
      code: a.code,
      name: a.name,
      amountMinor: Math.abs(a.balanceMinor),
    }));

  // Add current period Net Profit to Equity
  if (pnl.netProfitMinor !== 0) {
    equityRows.push({
      code: '3999',
      name: 'Current Period Net Earnings',
      amountMinor: pnl.netProfitMinor,
    });
  }

  const totalAssetsMinor = assetRows.reduce((sum, r) => sum + r.amountMinor, 0);
  const totalLiabilitiesMinor = liabilityRows.reduce((sum, r) => sum + r.amountMinor, 0);
  const totalEquityMinor = equityRows.reduce((sum, r) => sum + r.amountMinor, 0);
  const totalLiabilitiesAndEquityMinor = totalLiabilitiesMinor + totalEquityMinor;

  return {
    assetRows,
    liabilityRows,
    equityRows,
    totalAssetsMinor,
    totalLiabilitiesMinor,
    totalEquityMinor,
    totalLiabilitiesAndEquityMinor,
    isBalanced: totalAssetsMinor === totalLiabilitiesAndEquityMinor,
  };
}

export function generateGeneralLedger(
  accounts: Account[],
  entries: JournalEntry[],
  lines: JournalLine[]
): GeneralLedgerAccountReport[] {
  const entryMap = new Map<string, JournalEntry>(entries.map(e => [e.$id, e]));

  return accounts
    .filter(a => a.isActive)
    .sort((a, b) => a.code.localeCompare(b.code))
    .map(acct => {
      const acctLines = lines
        .filter(l => l.accountId === acct.$id)
        .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

      let running = 0;
      let totalDebit = 0;
      let totalCredit = 0;

      const rows: GeneralLedgerRow[] = acctLines.map(l => {
        const parentEntry = entryMap.get(l.entryId);
        totalDebit += l.debitMinor;
        totalCredit += l.creditMinor;
        running += (l.debitMinor - l.creditMinor);

        return {
          entryDate: l.entryDate,
          entryNo: parentEntry ? parentEntry.entryNo : 0,
          memo: l.description || parentEntry?.memo || '',
          source: parentEntry?.source || 'manual',
          debitMinor: l.debitMinor,
          creditMinor: l.creditMinor,
          runningBalanceMinor: running,
        };
      });

      return {
        account: acct,
        rows,
        totalDebitMinor: totalDebit,
        totalCreditMinor: totalCredit,
        netBalanceMinor: running,
      };
    });
}

/**
 * Rebuilds all account balances from the raw journal lines table and verifies
 * against cached balanceMinor columns. Proves ledger integrity!
 */
export function runIntegrityCheck(accounts: Account[], lines: JournalLine[]): IntegrityCheckResult {
  const rebuiltSums = new Map<string, number>();

  for (const line of lines) {
    const current = rebuiltSums.get(line.accountId) || 0;
    rebuiltSums.set(line.accountId, current + (line.debitMinor - line.creditMinor));
  }

  const items: IntegrityCheckItem[] = accounts.map(a => {
    const rebuilt = rebuiltSums.get(a.$id) || 0;
    const cached = a.balanceMinor;
    const matches = rebuilt === cached;

    return {
      accountId: a.$id,
      code: a.code,
      name: a.name,
      cachedBalanceMinor: cached,
      rebuiltBalanceMinor: rebuilt,
      matches,
      differenceMinor: Math.abs(cached - rebuilt),
    };
  });

  const matchedCount = items.filter(i => i.matches).length;

  return {
    allMatch: matchedCount === items.length,
    totalAccountsChecked: items.length,
    matchedCount,
    items,
  };
}
