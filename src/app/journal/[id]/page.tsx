'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LedgerStore } from '@/lib/storage/store';
import { JournalEntry, JournalLine, Account } from '@/lib/types';
import { formatMoney, formatMoneyWithoutSymbol } from '@/lib/money';
import { ArrowLeft, Ban, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

export default function JournalEntryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const entryId = params?.id as string;

  const [entry, setEntry] = useState<JournalEntry | undefined>(undefined);
  const [lines, setLines] = useState<JournalLine[]>([]);
  const [accountsMap, setAccountsMap] = useState<Map<string, Account>>(new Map());
  const [company, setCompany] = useState(LedgerStore.getCompany());
  const [voiding, setVoiding] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [showVoidModal, setShowVoidModal] = useState(false);

  const refresh = () => {
    const e = LedgerStore.getEntryById(entryId);
    setEntry(e);
    if (e) {
      const l = LedgerStore.getLinesForEntry(entryId);
      setLines(l);
    }
    const accs = LedgerStore.getAccounts();
    setAccountsMap(new Map(accs.map(a => [a.$id, a])));
    setCompany(LedgerStore.getCompany());
  };

  useEffect(() => {
    refresh();
    const unsub = LedgerStore.subscribe(refresh);
    return unsub;
  }, [entryId]);

  if (!entry) {
    return (
      <div className="card-brutal p-8 text-center bg-white space-y-4 font-mono">
        <p className="font-black text-lg">Journal entry not found.</p>
        <Link href="/journal" className="btn-brutal bg-[#FFE500] text-black px-4 py-2 text-xs inline-block">
          RETURN TO JOURNAL
        </Link>
      </div>
    );
  }

  const isVoided = !!entry.reversalOfId && entry.source !== 'reversal';
  const isReversal = entry.source === 'reversal';

  const handleVoid = () => {
    try {
      setVoiding(true);
      const rev = LedgerStore.voidJournalEntry(entry.$id, voidReason || 'Accounting adjustment');
      setShowVoidModal(false);
      router.push(`/journal/${rev.$id}`);
    } catch (err: any) {
      alert(`Failed to void entry: ${err.message}`);
      setVoiding(false);
    }
  };

  const totalDebit = lines.reduce((sum, l) => sum + l.debitMinor, 0);
  const totalCredit = lines.reduce((sum, l) => sum + l.creditMinor, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <div>
          <Link
            href="/journal"
            className="text-xs font-mono font-bold flex items-center gap-1 text-black/70 hover:text-black mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> BACK TO JOURNAL
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-black text-3xl sm:text-4xl text-black uppercase tracking-tight">
              JOURNAL ENTRY #{entry.entryNo}
            </h1>
            {isReversal ? (
              <span className="px-2.5 py-1 bg-[#FFE500] text-black font-mono font-black text-xs border-2 border-black">
                REVERSAL PAIR
              </span>
            ) : isVoided ? (
              <span className="px-2.5 py-1 bg-[#FF2A2A] text-white font-mono font-black text-xs border-2 border-black">
                VOIDED
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-[#00E065] text-black font-mono font-black text-xs border-2 border-black">
                COMMITTED
              </span>
            )}
          </div>
        </div>

        {/* Void / Reversal action */}
        {!isVoided && !isReversal && (
          <button
            onClick={() => setShowVoidModal(true)}
            className="btn-brutal bg-[#FF2A2A] text-white px-4 py-2 text-xs flex items-center gap-1.5 hover:bg-[#C71010]"
          >
            <Ban className="w-4 h-4" />
            <span>VOID VIA REVERSAL</span>
          </button>
        )}
      </div>

      {/* Void Notice Banners */}
      {isVoided && (
        <div className="p-4 bg-[#FF2A2A] text-white border-3 border-black font-mono text-xs flex items-center justify-between shadow-[4px_4px_0px_#000000]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>
              This entry has been neutralized by a reversal entry. The original record is retained for audit compliance.
            </span>
          </div>
          {entry.reversalOfId && (
            <Link
              href={`/journal/${entry.reversalOfId}`}
              className="px-2 py-1 bg-white text-black font-bold border border-black hover:bg-yellow-300"
            >
              VIEW REVERSAL ENTRY →
            </Link>
          )}
        </div>
      )}

      {isReversal && (
        <div className="p-4 bg-[#FFE500] text-black border-3 border-black font-mono text-xs flex items-center justify-between shadow-[4px_4px_0px_#000000]">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 shrink-0" />
            <span>
              This is a reversal entry generated to undo a previously posted transaction with swapped debits & credits.
            </span>
          </div>
          {entry.reversalOfId && (
            <Link
              href={`/journal/${entry.reversalOfId}`}
              className="px-2 py-1 bg-black text-white font-bold border border-black hover:bg-gray-800"
            >
              ORIGINAL ENTRY →
            </Link>
          )}
        </div>
      )}

      {/* Entry Meta Card */}
      <div className="card-brutal p-4 bg-white grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div>
          <span className="font-black uppercase text-black/60 block">ACCOUNTING DATE</span>
          <span className="font-bold text-sm text-black">
            {new Date(entry.entryDate).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        <div>
          <span className="font-black uppercase text-black/60 block">TRANSACTION SOURCE</span>
          <span className="font-bold text-sm text-black uppercase">
            {entry.source}
          </span>
        </div>

        <div>
          <span className="font-black uppercase text-black/60 block">POSTED BY</span>
          <span className="font-bold text-sm text-black">
            {entry.createdBy}
          </span>
        </div>

        <div>
          <span className="font-black uppercase text-black/60 block">TRANSACTION VALUE</span>
          <span className="font-black text-sm text-black tabular-nums">
            {formatMoney(entry.totalMinor, company.currency)}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-4 border-t-2 border-black/10 pt-2">
          <span className="font-black uppercase text-black/60 block">MEMO / PURPOSE</span>
          <span className="font-bold text-black text-sm">{entry.memo}</span>
        </div>
      </div>

      {/* Journal Lines Table */}
      <div className="card-brutal bg-white overflow-hidden">
        <div className="bg-black text-white p-3 font-mono font-black text-xs uppercase">
          BALANCED JOURNAL LINES
        </div>

        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#FFE500] border-b-2 border-black text-black uppercase text-[11px]">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Account Code & Name</th>
              <th className="p-3">Line Description</th>
              <th className="p-3 text-right">Debit (DR)</th>
              <th className="p-3 text-right">Credit (CR)</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black">
            {lines.map((l, idx) => {
              const acct = accountsMap.get(l.accountId);
              return (
                <tr key={l.$id || idx} className="hover:bg-yellow-50">
                  <td className="p-3 font-bold">{idx + 1}</td>
                  <td className="p-3 font-bold">
                    <span className="px-1.5 py-0.5 bg-black text-[#FFE500] text-[10px] mr-1.5 border border-black">
                      {acct?.code || '---'}
                    </span>
                    {acct?.name || 'Unknown Account'}
                  </td>
                  <td className="p-3 text-black/80">{l.description || '---'}</td>
                  <td className="p-3 text-right font-bold tabular-nums">
                    {l.debitMinor > 0 ? formatMoney(l.debitMinor, company.currency) : ''}
                  </td>
                  <td className="p-3 text-right font-bold tabular-nums">
                    {l.creditMinor > 0 ? formatMoney(l.creditMinor, company.currency) : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-[#FFFDF5] border-t-4 border-black font-black text-sm">
            <tr>
              <td colSpan={3} className="p-3 uppercase text-right">
                TOTALS
              </td>
              <td className="p-3 text-right font-mono tabular-nums bg-yellow-100 border-l-2 border-black">
                {formatMoney(totalDebit, company.currency)}
              </td>
              <td className="p-3 text-right font-mono tabular-nums bg-yellow-100 border-l-2 border-black">
                {formatMoney(totalCredit, company.currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Void Modal Confirmation */}
      {showVoidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="card-brutal bg-white w-full max-w-md p-6 space-y-4 shadow-[8px_8px_0px_#000000] font-mono">
            <div className="flex items-center gap-2 text-[#FF2A2A]">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-display font-black text-xl text-black uppercase">
                VOID BY REVERSAL
              </h3>
            </div>

            <p className="text-xs text-black/80">
              In double-entry bookkeeping, posted records are immutable and cannot be deleted. Voiding will generate an exact reversal journal entry that mirrors and restores all affected account balances.
            </p>

            <div>
              <label className="block text-xs font-black uppercase text-black/70 mb-1">
                Reason for Reversal
              </label>
              <input
                type="text"
                placeholder="e.g. Accounting correction, invoice cancellation..."
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                className="w-full border-2 border-black p-2 text-xs font-bold bg-[#FFFDF5] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowVoidModal(false)}
                className="btn-brutal bg-white text-black px-4 py-2 text-xs"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleVoid}
                disabled={voiding}
                className="btn-brutal bg-[#FF2A2A] text-white px-5 py-2 text-xs hover:bg-[#C71010]"
              >
                {voiding ? 'COMMITTING REVERSAL...' : 'CONFIRM VOID'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
