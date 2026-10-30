'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LedgerStore } from '@/lib/storage/store';
import { Account } from '@/lib/types';
import { parseMoneyToMinor } from '@/lib/money';
import { DifferenceIndicator } from '@/components/DifferenceIndicator';
import { Plus, Trash2, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

interface FormLine {
  id: string;
  accountId: string;
  debitStr: string;
  creditStr: string;
  description: string;
}

export default function NewJournalEntryPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [company, setCompany] = useState(LedgerStore.getCompany());
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [memo, setMemo] = useState('');
  const [lines, setLines] = useState<FormLine[]>([
    { id: '1', accountId: '', debitStr: '', creditStr: '', description: '' },
    { id: '2', accountId: '', debitStr: '', creditStr: '', description: '' },
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    setAccounts(LedgerStore.getAccounts().filter(a => a.isActive));
    setCompany(LedgerStore.getCompany());
  }, []);

  const handleAddLine = () => {
    setLines(prev => [
      ...prev,
      { id: String(Date.now()), accountId: '', debitStr: '', creditStr: '', description: '' },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) {
      alert('A journal entry must contain at least 2 lines.');
      return;
    }
    setLines(lines.filter((_, idx) => idx !== index));
  };

  const updateLine = (index: number, field: keyof FormLine, value: string) => {
    setLines(prev => {
      const copy = [...prev];
      const target = { ...copy[index] };

      // Mutual exclusivity: typing a debit clears credit, and vice versa
      if (field === 'debitStr' && value) {
        target.creditStr = '';
      } else if (field === 'creditStr' && value) {
        target.debitStr = '';
      }

      target[field] = value;
      copy[index] = target;
      return copy;
    });
  };

  // Compute live totals
  const totalDebitMinor = lines.reduce((sum, l) => sum + parseMoneyToMinor(l.debitStr), 0);
  const totalCreditMinor = lines.reduce((sum, l) => sum + parseMoneyToMinor(l.creditStr), 0);
  const differenceMinor = totalDebitMinor - totalCreditMinor;
  const isZero = totalDebitMinor === 0 && totalCreditMinor === 0;
  const activeLines = lines.filter(l => (parseMoneyToMinor(l.debitStr) > 0 || parseMoneyToMinor(l.creditStr) > 0));
  const allAccountsSelected = activeLines.length >= 2 && activeLines.every(l => Boolean(l.accountId));
  const isBalanced = differenceMinor === 0 && totalDebitMinor > 0;
  const canPost = isBalanced && allAccountsSelected;

  const handleAutoBalance = () => {
    if (differenceMinor === 0) return;
    const absDiff = Math.abs(differenceMinor);
    const diffStr = (absDiff / 100).toFixed(2);
    const needDebit = totalDebitMinor < totalCreditMinor;

    const emptyLineIdx = lines.findIndex(l => !l.debitStr && !l.creditStr);
    if (emptyLineIdx !== -1) {
      setLines(prev => {
        const copy = [...prev];
        copy[emptyLineIdx] = {
          ...copy[emptyLineIdx],
          debitStr: needDebit ? diffStr : '',
          creditStr: needDebit ? '' : diffStr,
        };
        return copy;
      });
    } else {
      setLines(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          accountId: '',
          debitStr: needDebit ? diffStr : '',
          creditStr: needDebit ? '' : diffStr,
          description: '',
        },
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isBalanced) {
      setErrorMsg('Cannot post unbalanced entry. Debits must exactly equal Credits.');
      return;
    }

    try {
      setPosting(true);
      const postLines = lines.map(l => ({
        accountId: l.accountId,
        debitMinor: parseMoneyToMinor(l.debitStr),
        creditMinor: parseMoneyToMinor(l.creditStr),
        description: l.description || memo,
      }));

      const newEntry = LedgerStore.postJournalEntry({
        companyId: company.$id,
        entryDate: new Date(entryDate).toISOString(),
        memo: memo.trim() || 'Manual journal entry',
        source: 'manual',
        lines: postLines,
      });

      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFE500', '#FF2A2A', '#00E065', '#000000'],
        });
      } catch {}

      setTimeout(() => {
        router.push(`/journal/${newEntry.$id}`);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to post entry');
      setPosting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b-4 border-black pb-4">
        <div>
          <Link
            href="/journal"
            className="text-xs font-mono font-bold flex items-center gap-1 text-black/70 hover:text-black mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> BACK TO JOURNAL
          </Link>
          <h1 className="font-display font-black text-3xl text-black uppercase tracking-tight">
            RECORD JOURNAL ENTRY
          </h1>
        </div>

        <div className="px-3 py-1 bg-[#FFE500] border-2 border-black font-mono text-xs font-black">
          DOUBLE-ENTRY ENGINE
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-[#FF2A2A] text-white border-3 border-black font-mono text-xs font-black shadow-[3px_3px_0px_#000000]">
          ⚠ ERROR: {errorMsg}
        </div>
      )}

      {/* Difference Indicator */}
      <DifferenceIndicator
        totalDebitMinor={totalDebitMinor}
        totalCreditMinor={totalCreditMinor}
        currency={company.currency}
        onAutoBalance={handleAutoBalance}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Memo & Date Meta */}
        <div className="card-brutal p-4 bg-white grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
          <div>
            <label className="block text-xs font-black uppercase text-black/70 mb-1">
              ACCOUNTING DATE
            </label>
            <input
              type="date"
              required
              value={entryDate}
              onChange={e => setEntryDate(e.target.value)}
              className="w-full border-2 border-black p-2 text-xs font-bold bg-[#FFFDF5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-black uppercase text-black/70 mb-1">
              ENTRY MEMO / DESCRIPTION
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Office rent for October, Cloud infrastructure subscription..."
              value={memo}
              onChange={e => setMemo(e.target.value)}
              className="w-full border-2 border-black p-2 text-xs font-bold bg-[#FFFDF5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        {/* Lines Grid */}
        <div className="card-brutal bg-white overflow-hidden">
          <div className="bg-black text-white p-3 flex items-center justify-between font-mono text-xs font-black">
            <span>JOURNAL LINES (MINIMUM 2)</span>
            <button
              type="button"
              onClick={handleAddLine}
              className="px-2 py-1 bg-[#FFE500] text-black border border-black hover:bg-yellow-300 flex items-center gap-1 font-bold text-[11px]"
            >
              <Plus className="w-3.5 h-3.5" /> ADD LINE
            </button>
          </div>

          <div className="p-4 space-y-3 font-mono">
            {lines.map((line, idx) => (
              <div
                key={line.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center border-2 border-black p-2.5 bg-[#FFFDF5] shadow-[2px_2px_0px_#000000]"
              >
                {/* Account selector (5 cols) */}
                <div className="md:col-span-5">
                  <label className="text-[10px] font-black uppercase text-black/60 block md:hidden">
                    Account
                  </label>
                  <select
                    required
                    value={line.accountId}
                    onChange={e => updateLine(idx, 'accountId', e.target.value)}
                    className="w-full border-2 border-black p-1.5 text-xs font-bold bg-white focus:outline-none"
                  >
                    <option value="">-- Select Account --</option>
                    {accounts.map(acc => (
                      <option key={acc.$id} value={acc.$id}>
                        {acc.code} - {acc.name} ({acc.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Line Description (3 cols) */}
                <div className="md:col-span-3">
                  <label className="text-[10px] font-black uppercase text-black/60 block md:hidden">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Line note (optional)"
                    value={line.description}
                    onChange={e => updateLine(idx, 'description', e.target.value)}
                    className="w-full border-2 border-black p-1.5 text-xs font-bold bg-white focus:outline-none"
                  />
                </div>

                {/* Debit Input (2 cols) */}
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-black/60 block md:hidden">
                    Debit
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Debit (₹)"
                    value={line.debitStr}
                    onChange={e => updateLine(idx, 'debitStr', e.target.value)}
                    className="w-full border-2 border-black p-1.5 text-xs font-mono font-bold bg-white text-right focus:outline-none focus:bg-yellow-50"
                  />
                </div>

                {/* Credit Input (2 cols) */}
                <div className="md:col-span-2 flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase text-black/60 block md:hidden">
                      Credit
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Credit (₹)"
                      value={line.creditStr}
                      onChange={e => updateLine(idx, 'creditStr', e.target.value)}
                      className="w-full border-2 border-black p-1.5 text-xs font-mono font-bold bg-white text-right focus:outline-none focus:bg-yellow-50"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveLine(idx)}
                    disabled={lines.length <= 2}
                    title="Remove Line"
                    className="p-1.5 border border-black text-[#FF2A2A] hover:bg-[#FF2A2A] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-50 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
            <button
              type="button"
              onClick={handleAddLine}
              className="btn-brutal bg-white text-black px-4 py-2 text-xs flex items-center gap-1.5 hover:bg-yellow-200"
            >
              <Plus className="w-4 h-4" /> ADD ANOTHER LINE
            </button>

            <button
              type="submit"
              disabled={!canPost || posting}
              className={`btn-brutal px-8 py-3 text-sm flex items-center gap-2 ${
                canPost
                  ? 'bg-[#00E065] text-black hover:bg-[#00c95a]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              {posting
                ? 'COMMITTING TRANSACTION...'
                : !isBalanced
                ? 'BALANCE TO POST (DIFF: ' + company.currency + ' ' + (Math.abs(differenceMinor) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 }) + ')'
                : !allAccountsSelected
                ? 'SELECT ACCOUNT FOR LINE 2'
                : 'POST ENTRY TO LEDGER'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
