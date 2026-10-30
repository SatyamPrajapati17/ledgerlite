import { NextRequest, NextResponse } from 'next/server';
import { validateJournalEntry } from '@/lib/ledger/validate';
import { isAppwriteConfigured, tablesDB, DATABASE_ID } from '@/lib/appwrite/config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId, entryDate, memo, lines, source = 'manual' } = body;

    if (!companyId || !lines || !Array.isArray(lines)) {
      return NextResponse.json(
        { error: 'Invalid payload: companyId and lines are required.' },
        { status: 400 }
      );
    }

    // Pure validation
    const validation = validateJournalEntry({
      companyId,
      entryDate: entryDate || new Date().toISOString(),
      memo,
      lines,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 422 }
      );
    }

    // If Appwrite Cloud is configured, execute via TablesDB transactions
    if (isAppwriteConfigured()) {
      try {
        // 1. Allocate sequential entry number with atomic increment
        // Counters table: counterKey: 'entry'
        const counterRow = await tablesDB.incrementRowColumn({
          databaseId: DATABASE_ID,
          tableId: 'counters',
          rowId: `counter_${companyId}_entry`,
          column: 'value',
          value: 1,
        });

        const entryNo = counterRow.value || Date.now();
        const entryId = `entry_${companyId}_${entryNo}`;

        // 2. Open TablesDB transaction
        const tx = await tablesDB.createTransaction();

        // 3. Stage operations
        const operations: any[] = [
          {
            action: 'create',
            databaseId: DATABASE_ID,
            tableId: 'journalEntries',
            rowId: entryId,
            data: {
              companyId,
              entryNo,
              entryDate: entryDate || new Date().toISOString(),
              memo: memo || `Journal Entry #${entryNo}`,
              source,
              totalMinor: validation.totalDebitMinor,
              createdBy: 'System User',
            },
          },
        ];

        // Add line creations and account balance increments
        lines.forEach((l: any, idx: number) => {
          const lineId = `line_${entryId}_${idx + 1}`;
          operations.push({
            action: 'create',
            databaseId: DATABASE_ID,
            tableId: 'journalLines',
            rowId: lineId,
            data: {
              companyId,
              entryId,
              lineNo: idx + 1,
              entryDate: entryDate || new Date().toISOString(),
              accountId: l.accountId,
              debitMinor: l.debitMinor || 0,
              creditMinor: l.creditMinor || 0,
              description: l.description || memo,
            },
          });

          // Balance minor: debit increases balance, credit decreases balance
          const net = (l.debitMinor || 0) - (l.creditMinor || 0);
          if (net !== 0) {
            operations.push({
              action: net > 0 ? 'increment' : 'decrement',
              databaseId: DATABASE_ID,
              tableId: 'accounts',
              rowId: l.accountId,
              data: {
                column: 'balanceMinor',
                value: Math.abs(net),
              },
            });
          }
        });

        // Stage operations in transaction
        await tablesDB.createOperations({
          transactionId: tx.$id,
          operations,
        });

        // Commit transaction
        const committed = await tablesDB.updateTransaction({
          transactionId: tx.$id,
          commit: true,
        });

        return NextResponse.json({
          success: true,
          entryId,
          entryNo,
          committed,
          differenceMinor: validation.differenceMinor,
        });
      } catch (appwriteErr: any) {
        return NextResponse.json(
          {
            error: 'Appwrite TablesDB transaction failed',
            message: appwriteErr.message,
          },
          { status: 500 }
        );
      }
    }

    // Fallback: Local demo response
    return NextResponse.json({
      success: true,
      mode: 'local_engine',
      totalDebitMinor: validation.totalDebitMinor,
      totalCreditMinor: validation.totalCreditMinor,
      differenceMinor: validation.differenceMinor,
      message: 'Validated and balanced by construction',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message },
      { status: 500 }
    );
  }
}
