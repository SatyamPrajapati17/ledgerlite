'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LedgerStore } from '@/lib/storage/store';
import { Account, JournalEntry, Invoice } from '@/lib/types';
import { formatMoney, formatMoneyWithoutSymbol } from '@/lib/money';
import { 
  ArrowUpRight, ArrowDownRight, Wallet, Receipt, TrendingUp, TrendingDown, 
  PlusCircle, ShieldCheck, FileText, BookOpen, Sparkles, CheckCircle2
} from 'lucide-react';
import { IntegrityCheckModal } from '@/components/IntegrityCheckModal';

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [company, setCompany] = useState(LedgerStore.getCompany());
  const [showIntegrity, setShowIntegrity] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const refreshData = () => {
    setAccounts(LedgerStore.getAccounts());
    setEntries(LedgerStore.getEntries());
    setInvoices(LedgerStore.getInvoices());
    setCompany(LedgerStore.getCompany());
    setLastUpdated(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    refreshData();
    const unsub = LedgerStore.subscribe(() => {
      refreshData();
    });
    return unsub;
  }, []);

  // Compute 4 KPI values
  // 1. Cash & Bank (Codes 1000, 1010 or type asset with systemKey 'cash' or 'bank')
  const cashAccounts = accounts.filter(a => a.systemKey === 'cash' || a.systemKey === 'bank' || a.code === '1000' || a.code === '1010');
  const cashMinor = cashAccounts.reduce((sum, a) => sum + a.balanceMinor, 0);

  // 2. Accounts Receivable (Uncollected)
  const arAccount = accounts.find(a => a.systemKey === 'ar' || a.code === '1100');
  const arMinor = arAccount ? arAccount.balanceMinor : 0;

  // 3. Revenue (Income accounts: credit balance)
  const incomeAccounts = accounts.filter(a => a.type === 'income');
  const revenueMinor = incomeAccounts.reduce((sum, a) => sum + Math.abs(a.balanceMinor), 0);

  // 4. Expenses (Expense accounts: debit balance)
  const expenseAccounts = accounts.filter(a => a.type === 'expense');
  const expensesMinor = expenseAccounts.reduce((sum, a) => sum + a.balanceMinor, 0);

  const netIncomeMinor = revenueMinor - expensesMinor;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#FFE500] text-black font-black text-xs border-2 border-black font-mono">
              FINANCIAL COMMAND CENTER
            </span>
            <span suppressHydrationWarning className="text-xs font-mono font-bold text-black/60 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#00E065] animate-pulse" />
              LAST SYNC: {lastUpdated || 'LIVE'}
            </span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-black uppercase tracking-tight mt-1">
            {company.name} LEDGER
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowIntegrity(true)}
            className="btn-brutal bg-white text-black px-3.5 py-2 text-xs flex items-center gap-1.5 hover:bg-yellow-200"
          >
            <ShieldCheck className="w-4 h-4 text-[#FF2A2A]" />
            <span>INTEGRITY AUDIT</span>
          </button>

          <Link
            href="/invoices/new"
            className="btn-brutal bg-[#FFE500] text-black px-4 py-2 text-xs flex items-center gap-1.5 hover:bg-yellow-300"
          >
            <PlusCircle className="w-4 h-4 text-black" />
            <span>CREATE INVOICE</span>
          </Link>

          <Link
            href="/journal/new"
            className="btn-brutal bg-[#FF2A2A] text-white px-4 py-2 text-xs flex items-center gap-1.5 hover:bg-[#C71010]"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>POST JOURNAL ENTRY</span>
          </Link>
        </div>
      </div>

      {/* 4 Brutalist KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Cash & Liquid Funds */}
        <div className="card-brutal p-4 bg-white hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-black uppercase text-black/70">
              CASH & BANK BALANCES
            </span>
            <div className="p-1.5 bg-[#FFE500] border-2 border-black">
              <Wallet className="w-4 h-4 text-black" />
            </div>
          </div>
          <div className="font-mono font-black text-2xl text-black tabular-nums mt-2">
            {formatMoney(cashMinor, company.currency)}
          </div>
          <div className="text-[11px] font-mono text-black/70 mt-1 flex items-center gap-1">
            <span className="text-[#00E065] font-black">● LIQUID</span>
            <span>Across primary bank & cash floats</span>
          </div>
        </div>

        {/* Card 2: Accounts Receivable */}
        <div className="card-brutal p-4 bg-white hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-black uppercase text-black/70">
              ACCOUNTS RECEIVABLE
            </span>
            <div className="p-1.5 bg-[#FF2A2A] text-white border-2 border-black">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-black text-2xl text-black tabular-nums mt-2">
            {formatMoney(arMinor, company.currency)}
          </div>
          <div className="text-[11px] font-mono text-black/70 mt-1">
            <span>{invoices.filter(i => i.status === 'sent' || i.status === 'partial').length} pending customer invoices</span>
          </div>
        </div>

        {/* Card 3: Revenue MTD */}
        <div className="card-brutal p-4 bg-[#FFE500] hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-black uppercase text-black">
              TOTAL REVENUE (MTD)
            </span>
            <div className="p-1.5 bg-black text-[#FFE500] border-2 border-black">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-black text-2xl text-black tabular-nums mt-2">
            {formatMoney(revenueMinor, company.currency)}
          </div>
          <div className="text-[11px] font-mono text-black/90 mt-1 font-bold">
            <span>Sales & Service earnings</span>
          </div>
        </div>

        {/* Card 4: Operating Expenses MTD */}
        <div className="card-brutal p-4 bg-white hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-black uppercase text-black/70">
              EXPENSES (MTD)
            </span>
            <div className="p-1.5 bg-black text-white border-2 border-black">
              <TrendingDown className="w-4 h-4 text-[#FF2A2A]" />
            </div>
          </div>
          <div className="font-mono font-black text-2xl text-[#FF2A2A] tabular-nums mt-2">
            {formatMoney(expensesMinor, company.currency)}
          </div>
          <div className="text-[11px] font-mono text-black/70 mt-1">
            <span className="font-bold">
              Net Profit: {formatMoney(netIncomeMinor, company.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Ledger Performance & Revenue vs Expense Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue vs Expenses Breakdown */}
        <div className="lg:col-span-2 card-brutal p-5 bg-white space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div>
              <h2 className="font-display font-black text-xl text-black uppercase">
                FINANCIAL HEALTH & FLOW
              </h2>
              <p className="text-xs font-mono text-black/60 font-semibold">
                OCTOBER 2026 INCOME STATEMENT PERFORMANCE
              </p>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs font-black">
              <span className="px-2 py-0.5 bg-[#FFE500] border border-black">REVENUE</span>
              <span className="px-2 py-0.5 bg-[#FF2A2A] text-white border border-black">EXPENSES</span>
            </div>
          </div>

          {/* High-Contrast Visual Comparison Bars */}
          <div className="space-y-4 font-mono">
            {/* Revenue Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>TOTAL REVENUE GENERATED</span>
                <span className="tabular-nums font-black">{formatMoney(revenueMinor, company.currency)}</span>
              </div>
              <div className="h-6 w-full bg-gray-100 border-2 border-black p-0.5">
                <div
                  className="h-full bg-[#FFE500] border-r-2 border-black transition-all duration-500"
                  style={{ width: `${revenueMinor > 0 ? 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Expenses Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>TOTAL OPERATING EXPENSES</span>
                <span className="tabular-nums font-black text-[#FF2A2A]">{formatMoney(expensesMinor, company.currency)}</span>
              </div>
              <div className="h-6 w-full bg-gray-100 border-2 border-black p-0.5">
                <div
                  className="h-full bg-[#FF2A2A] border-r-2 border-black transition-all duration-500"
                  style={{
                    width: `${revenueMinor > 0 ? Math.min(100, Math.round((expensesMinor / revenueMinor) * 100)) : 50}%`,
                  }}
                />
              </div>
            </div>

            {/* Net Margin Box */}
            <div className="border-3 border-black p-3 bg-[#FFFDF5] flex items-center justify-between mt-4">
              <div>
                <span className="text-[10px] font-black uppercase text-black/70">
                  NET OPERATING PROFIT
                </span>
                <div className="text-xl font-black text-black tabular-nums">
                  {formatMoney(netIncomeMinor, company.currency)}
                </div>
              </div>
              <div className="text-right">
                <span className="px-2 py-1 bg-[#00E065] text-black font-black text-xs border-2 border-black">
                  {revenueMinor > 0 ? `${((netIncomeMinor / revenueMinor) * 100).toFixed(1)}% PROFIT MARGIN` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Books Snapshot & Links */}
        <div className="card-brutal p-5 bg-[#FFFDF5] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-1.5 border-b-2 border-black pb-2">
              <Sparkles className="w-5 h-5 text-[#FF2A2A]" />
              <h3 className="font-display font-black text-lg text-black uppercase">
                TABLESDB ADVANTAGES
              </h3>
            </div>

            <ul className="mt-3 space-y-2.5 text-xs font-mono">
              <li className="flex items-start gap-2">
                <span className="px-1.5 py-0.2 bg-[#00E065] text-black font-black text-[10px] border border-black mt-0.5">✓</span>
                <span><strong>No Unbalanced Entries:</strong> Staged in one transaction; all rows commit or none do.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="px-1.5 py-0.2 bg-[#FFE500] text-black font-black text-[10px] border border-black mt-0.5">✓</span>
                <span><strong>Atomic Increments:</strong> Account balances update synchronously with zero race conditions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="px-1.5 py-0.2 bg-[#FF2A2A] text-white font-black text-[10px] border border-black mt-0.5">✓</span>
                <span><strong>Immutable Audit Log:</strong> Corrections are posted as reversal pairs.</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t-2 border-black space-y-2">
            <Link
              href="/reports"
              className="btn-brutal bg-black text-white w-full py-2 text-xs text-center block hover:bg-gray-800"
            >
              VIEW TRIAL BALANCE & P&L →
            </Link>
            <Link
              href="/accounts"
              className="btn-brutal bg-white text-black w-full py-2 text-xs text-center block hover:bg-yellow-200"
            >
              EXPLORE CHART OF ACCOUNTS (21) →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card-brutal bg-white overflow-hidden">
        <div className="bg-black text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#FFE500]" />
            <h2 className="font-display font-black text-lg uppercase tracking-tight">
              RECENT JOURNAL POSTS
            </h2>
          </div>
          <Link
            href="/journal"
            className="text-xs font-mono font-bold text-yellow-300 hover:underline"
          >
            VIEW ALL ENTRIES ({entries.length}) →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#FFE500] border-b-2 border-black text-black uppercase text-[11px]">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Date</th>
                <th className="p-3">Memo</th>
                <th className="p-3">Source</th>
                <th className="p-3 text-right">Debit / Credit Total</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {entries.slice(0, 7).map(entry => {
                const isVoided = !!entry.reversalOfId;
                const isReversal = entry.source === 'reversal';

                return (
                  <tr key={entry.$id} className="hover:bg-yellow-50 transition-colors">
                    <td className="p-3 font-black">#{entry.entryNo}</td>
                    <td className="p-3 text-black/80">
                      {new Date(entry.entryDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="p-3 font-semibold text-black max-w-xs truncate">
                      {entry.memo}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-gray-200 border border-black text-[10px] uppercase font-bold">
                        {entry.source}
                      </span>
                    </td>
                    <td className="p-3 text-right font-black tabular-nums">
                      {formatMoney(entry.totalMinor, company.currency)}
                    </td>
                    <td className="p-3 text-center">
                      {isReversal ? (
                        <span className="px-2 py-0.5 bg-[#FFE500] text-black border border-black font-black text-[10px]">
                          REVERSAL
                        </span>
                      ) : isVoided ? (
                        <span className="px-2 py-0.5 bg-[#FF2A2A] text-white border border-black font-black text-[10px]">
                          VOIDED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-[#00E065] text-black border border-black font-black text-[10px]">
                          POSTED
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <Link
                        href={`/journal/${entry.$id}`}
                        className="px-2 py-1 bg-white border border-black text-[10px] font-bold hover:bg-black hover:text-white transition-all shadow-[1px_1px_0px_#000000]"
                      >
                        VIEW LINES
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integrity Modal */}
      <IntegrityCheckModal
        isOpen={showIntegrity}
        onClose={() => setShowIntegrity(false)}
      />
    </div>
  );
}
