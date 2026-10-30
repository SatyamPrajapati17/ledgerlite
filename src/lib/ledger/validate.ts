import { Account } from '../types';

export interface DraftJournalLine {
  accountId: string;
  debitMinor: number;
  creditMinor: number;
  description?: string;
}

export interface DraftJournalEntry {
  companyId: string;
  entryDate: string;
  memo?: string;
  lines: DraftJournalLine[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  totalDebitMinor: number;
  totalCreditMinor: number;
  differenceMinor: number; // totalDebitMinor - totalCreditMinor
}

/**
 * Pure validator for double-entry bookkeeping transactions.
 * Enforces:
 * 1. At least two lines
 * 2. Total debits === Total credits (strictly zero difference)
 * 3. Each line has either positive debit OR positive credit, never both, never <= 0
 * 4. Accounts are valid and active
 */
export function validateJournalEntry(
  entry: DraftJournalEntry,
  accountsMap?: Map<string, Account>
): ValidationResult {
  const errors: string[] = [];
  let totalDebitMinor = 0;
  let totalCreditMinor = 0;

  if (!entry.lines || entry.lines.length < 2) {
    errors.push('A journal entry must contain at least two lines.');
  }

  entry.lines.forEach((line, index) => {
    const lineNum = index + 1;
    if (!line.accountId) {
      errors.push(`Line ${lineNum}: Please select an account.`);
      return;
    }

    if (accountsMap) {
      const acct = accountsMap.get(line.accountId);
      if (!acct) {
        errors.push(`Line ${lineNum}: Account not found.`);
      } else if (!acct.isActive) {
        errors.push(`Line ${lineNum}: Account "${acct.name}" (${acct.code}) is inactive.`);
      }
    }

    const hasDebit = line.debitMinor > 0;
    const hasCredit = line.creditMinor > 0;

    if (!hasDebit && !hasCredit) {
      errors.push(`Line ${lineNum}: Enter either a debit or credit amount greater than 0.`);
    } else if (hasDebit && hasCredit) {
      errors.push(`Line ${lineNum}: A single line cannot have both a debit and a credit.`);
    } else if (line.debitMinor < 0 || line.creditMinor < 0) {
      errors.push(`Line ${lineNum}: Amounts cannot be negative.`);
    }

    totalDebitMinor += line.debitMinor || 0;
    totalCreditMinor += line.creditMinor || 0;
  });

  const differenceMinor = totalDebitMinor - totalCreditMinor;

  if (differenceMinor !== 0) {
    errors.push(
      `Entry is out of balance. Total debits (${(totalDebitMinor / 100).toFixed(2)}) must equal total credits (${(totalCreditMinor / 100).toFixed(2)}). Difference: ${(Math.abs(differenceMinor) / 100).toFixed(2)}.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    totalDebitMinor,
    totalCreditMinor,
    differenceMinor,
  };
}
