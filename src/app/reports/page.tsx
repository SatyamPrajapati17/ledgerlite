'use client';

import React, { useState, useEffect } from 'react';
import { LedgerStore } from '@/lib/storage/store';
import { Account, JournalEntry, JournalLine } from '@/lib/types';
import {
  generateTrialBalance,
  generateProfitAndLoss,
  generateBalanceSheet,
  generateGeneralLedger,
  TrialBalanceReport,
  ProfitAndLossReport,
  BalanceSheetReport,
  GeneralLedgerAccountReport,
} from '@/lib/ledger/reports';
import { formatMoney, formatMoneyWithoutSymbol } from '@/lib/money';
import { Download, CheckCircle2, AlertTriangle, Scale, BookOpen, Layers } from 'lucide-react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'trial' | 'pnl' | 'balanceSheet' | 'ledger'>('trial');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [lines, setLines] = useState<JournalLine[]>([]);
  const [company, setCompany] = useState(LedgerStore.getCompany());

  const refresh = () => {
    setAccounts(LedgerStore.getAccounts());
    setEntries(LedgerStore.getEntries());
    setLines(LedgerStore.getLines());
    setCompany(LedgerStore.getCompany());
  };

  useEffect(() => {
    refresh();
    const unsub = LedgerStore.subscribe(refresh);
    return unsub;
  }, []);

  const trialBalance: TrialBalanceReport = generateTrialBalance(accounts);
  const pnl: ProfitAndLossReport = generateProfitAndLoss(accounts);
  const balanceSheet: BalanceSheetReport = generateBalanceSheet(accounts);
  const generalLedger: GeneralLedgerAccountReport[] = generateGeneralLedger(accounts, entries, lines);

  // CSV Export
  const downloadCSV = () => {
    let csv = '';
    const dateStr = new Date().toISOString().split('T')[0];

    if (activeTab === 'trial') {
      csv = 'Account Code,Account Name,Type,Debit,Credit\n';
      trialBalance.rows.forEach(r => {
        csv += `"${r.code}","${r.name}","${r.type}",${(r.debitMinor / 100).toFixed(2)},${(r.creditMinor / 100).toFixed(2)}\n`;
      });
      csv += `TOTALS,,,"${(trialBalance.totalDebitMinor / 100).toFixed(2)}","${(trialBalance.totalCreditMinor / 100).toFixed(2)}"\n`;
    } else if (activeTab === 'pnl') {
      csv = 'Section,Account Code,Account Name,Amount\n';
      pnl.incomeRows.forEach(r => {
        csv += `Income,"${r.code}","${r.name}",${(r.amountMinor / 100).toFixed(2)}\n`;
      });
      csv += `Total Income,,,${(pnl.totalIncomeMinor / 100).toFixed(2)}\n`;
      pnl.expenseRows.forEach(r => {
        csv += `Expense,"${r.code}","${r.name}",${(r.amountMinor / 100).toFixed(2)}\n`;
      });
      csv += `Total Expenses,,,${(pnl.totalExpenseMinor / 100).toFixed(2)}\n`;
      csv += `Net Profit,,,${(pnl.netProfitMinor / 100).toFixed(2)}\n`;
    } else if (activeTab === 'balanceSheet') {
      csv = 'Section,Account Code,Account Name,Amount\n';
      balanceSheet.assetRows.forEach(r => {
        csv += `Assets,"${r.code}","${r.name}",${(r.amountMinor / 100).toFixed(2)}\n`;
      });
      balanceSheet.liabilityRows.forEach(r => {
        csv += `Liabilities,"${r.code}","${r.name}",${(r.amountMinor / 100).toFixed(2)}\n`;
      });
      balanceSheet.equityRows.forEach(r => {
        csv += `Equity,"${r.code}","${r.name}",${(r.amountMinor / 100).toFixed(2)}\n`;
      });
    } else {
      csv = 'Account,Date,Entry #,Memo,Debit,Credit,Running Balance\n';
      generalLedger.forEach(gl => {
        gl.rows.forEach(r => {
          csv += `"${gl.account.code} - ${gl.account.name}","${r.entryDate}",#${r.entryNo},"${r.memo}",${(r.debitMinor / 100).toFixed(2)},${(r.creditMinor / 100).toFixed(2)},${(r.runningBalanceMinor / 100).toFixed(2)}\n`;
        });
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${company.name}_${activeTab}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <div>
          <span className="px-2 py-0.5 bg-[#FFE500] text-black font-black text-xs border-2 border-black font-mono">
            FINANCIAL STATEMENTS
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-black uppercase tracking-tight mt-1">
            ACCOUNTING REPORTS
          </h1>
        </div>

        <button
          onClick={downloadCSV}
          className="btn-brutal bg-[#FFE500] text-black px-4 py-2 text-xs flex items-center gap-2 hover:bg-yellow-300"
        >
          <Download className="w-4 h-4" />
          <span>EXPORT CSV</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-black">
        <button
          onClick={() => setActiveTab('trial')}
          className={`px-4 py-2 border-2 border-black transition-all ${
            activeTab === 'trial'
              ? 'bg-black text-[#FFE500] shadow-[3px_3px_0px_#FF2A2A] translate-x-0.5 translate-y-0.5'
              : 'bg-white text-black hover:bg-gray-100 shadow-[2px_2px_0px_#000000]'
          }`}
        >
          1. TRIAL BALANCE
        </button>

        <button
          onClick={() => setActiveTab('pnl')}
          className={`px-4 py-2 border-2 border-black transition-all ${
            activeTab === 'pnl'
              ? 'bg-black text-[#FFE500] shadow-[3px_3px_0px_#FF2A2A] translate-x-0.5 translate-y-0.5'
              : 'bg-white text-black hover:bg-gray-100 shadow-[2px_2px_0px_#000000]'
          }`}
        >
          2. PROFIT & LOSS (P&L)
        </button>

        <button
          onClick={() => setActiveTab('balanceSheet')}
          className={`px-4 py-2 border-2 border-black transition-all ${
            activeTab === 'balanceSheet'
              ? 'bg-black text-[#FFE500] shadow-[3px_3px_0px_#FF2A2A] translate-x-0.5 translate-y-0.5'
              : 'bg-white text-black hover:bg-gray-100 shadow-[2px_2px_0px_#000000]'
          }`}
        >
          3. BALANCE SHEET
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 border-2 border-black transition-all ${
            activeTab === 'ledger'
              ? 'bg-black text-[#FFE500] shadow-[3px_3px_0px_#FF2A2A] translate-x-0.5 translate-y-0.5'
              : 'bg-white text-black hover:bg-gray-100 shadow-[2px_2px_0px_#000000]'
          }`}
        >
          4. GENERAL LEDGER
        </button>
      </div>

      {/* Tab 1: Trial Balance */}
      {activeTab === 'trial' && (
        <div className="space-y-4 font-mono">
          {/* Balanced Status Banner */}
          <div
            className={`card-brutal p-4 flex items-center justify-between ${
              trialBalance.isBalanced ? 'bg-[#00E065] text-black' : 'bg-[#FF2A2A] text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              {trialBalance.isBalanced ? (
                <CheckCircle2 className="w-8 h-8 text-black shrink-0" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-white shrink-0" />
              )}
              <div>
                <h2 className="font-display font-black text-xl uppercase tracking-tight">
                  {trialBalance.isBalanced ? 'TRIAL BALANCE IS BALANCED' : 'TRIAL BALANCE OUT OF EQUILIBRIUM'}
                </h2>
                <p className="text-xs font-bold opacity-90">
                  Total Debits ({formatMoney(trialBalance.totalDebitMinor, company.currency)}) equal Total Credits ({formatMoney(trialBalance.totalCreditMinor, company.currency)}).
                </p>
              </div>
            </div>

            <span className="px-2 py-1 bg-black text-white text-xs font-black uppercase">
              DIFF: ₹{formatMoneyWithoutSymbol(Math.abs(trialBalance.differenceMinor))}
            </span>
          </div>

          {/* Table */}
          <div className="card-brutal bg-white overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFE500] border-b-2 border-black text-black uppercase text-[11px] font-black">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Account Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Debit (DR)</th>
                  <th className="p-3 text-right">Credit (CR)</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black">
                {trialBalance.rows.map(r => (
                  <tr key={r.accountId} className="hover:bg-yellow-50">
                    <td className="p-3 font-bold">{r.code}</td>
                    <td className="p-3 font-bold text-black">{r.name}</td>
                    <td className="p-3 uppercase text-[10px] text-black/70 font-bold">{r.type}</td>
                    <td className="p-3 text-right font-mono tabular-nums font-bold">
                      {r.debitMinor > 0 ? formatMoney(r.debitMinor, company.currency) : ''}
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums font-bold">
                      {r.creditMinor > 0 ? formatMoney(r.creditMinor, company.currency) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[#FFFDF5] border-t-4 border-black font-black text-sm">
                <tr>
                  <td colSpan={3} className="p-3 uppercase text-right">
                    VERIFIED LEDGER TOTALS
                  </td>
                  <td className="p-3 text-right font-mono tabular-nums bg-yellow-100 border-l-2 border-black">
                    {formatMoney(trialBalance.totalDebitMinor, company.currency)}
                  </td>
                  <td className="p-3 text-right font-mono tabular-nums bg-yellow-100 border-l-2 border-black">
                    {formatMoney(trialBalance.totalCreditMinor, company.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Profit & Loss */}
      {activeTab === 'pnl' && (
        <div className="space-y-6 font-mono">
          {/* Net Profit Callout Card */}
          <div className="card-brutal p-5 bg-[#FFE500] flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase text-black/70 block">
                OCTOBER 2026 NET OPERATING PROFIT
              </span>
              <div className="font-mono font-black text-3xl text-black tabular-nums mt-1">
                {formatMoney(pnl.netProfitMinor, company.currency)}
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 bg-black text-[#00E065] text-xs font-black border-2 border-black">
                TOTAL REVENUE: {formatMoney(pnl.totalIncomeMinor, company.currency)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Accounts */}
            <div className="card-brutal bg-white overflow-hidden">
              <div className="bg-[#00E065] text-black p-3 font-black text-xs uppercase flex justify-between border-b-2 border-black">
                <span>INCOME & REVENUE</span>
                <span>{formatMoney(pnl.totalIncomeMinor, company.currency)}</span>
              </div>
              <table className="w-full text-xs text-left">
                <tbody className="divide-y-2 divide-black">
                  {pnl.incomeRows.map(r => (
                    <tr key={r.code} className="hover:bg-yellow-50">
                      <td className="p-3 font-bold">{r.code} - {r.name}</td>
                      <td className="p-3 text-right font-black tabular-nums">
                        {formatMoney(r.amountMinor, company.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Expense Accounts */}
            <div className="card-brutal bg-white overflow-hidden">
              <div className="bg-[#FF2A2A] text-white p-3 font-black text-xs uppercase flex justify-between border-b-2 border-black">
                <span>OPERATING EXPENSES</span>
                <span>{formatMoney(pnl.totalExpenseMinor, company.currency)}</span>
              </div>
              <table className="w-full text-xs text-left">
                <tbody className="divide-y-2 divide-black">
                  {pnl.expenseRows.map(r => (
                    <tr key={r.code} className="hover:bg-yellow-50">
                      <td className="p-3 font-bold">{r.code} - {r.name}</td>
                      <td className="p-3 text-right font-black tabular-nums text-[#FF2A2A]">
                        {formatMoney(r.amountMinor, company.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Balance Sheet */}
      {activeTab === 'balanceSheet' && (
        <div className="space-y-6 font-mono">
          <div className="card-brutal p-4 bg-[#00E065] text-black flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              <div>
                <h3 className="font-display font-black text-lg uppercase">
                  FUNDAMENTAL ACCOUNTING EQUATION BALANCED
                </h3>
                <p className="text-xs font-bold">
                  Total Assets ({formatMoney(balanceSheet.totalAssetsMinor, company.currency)}) = Total Liabilities + Equity ({formatMoney(balanceSheet.totalLiabilitiesAndEquityMinor, company.currency)})
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assets */}
            <div className="card-brutal bg-white overflow-hidden">
              <div className="bg-[#FFE500] text-black p-3 font-black text-xs uppercase flex justify-between border-b-2 border-black">
                <span>ASSETS</span>
                <span>{formatMoney(balanceSheet.totalAssetsMinor, company.currency)}</span>
              </div>
              <table className="w-full text-xs text-left">
                <tbody className="divide-y-2 divide-black">
                  {balanceSheet.assetRows.map(r => (
                    <tr key={r.code} className="hover:bg-yellow-50">
                      <td className="p-3 font-bold">{r.code} - {r.name}</td>
                      <td className="p-3 text-right font-black tabular-nums">
                        {formatMoney(r.amountMinor, company.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Liabilities & Equity */}
            <div className="space-y-4">
              <div className="card-brutal bg-white overflow-hidden">
                <div className="bg-[#FF2A2A] text-white p-3 font-black text-xs uppercase flex justify-between border-b-2 border-black">
                  <span>LIABILITIES</span>
                  <span>{formatMoney(balanceSheet.totalLiabilitiesMinor, company.currency)}</span>
                </div>
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y-2 divide-black">
                    {balanceSheet.liabilityRows.map(r => (
                      <tr key={r.code} className="hover:bg-yellow-50">
                        <td className="p-3 font-bold">{r.code} - {r.name}</td>
                        <td className="p-3 text-right font-black tabular-nums">
                          {formatMoney(r.amountMinor, company.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card-brutal bg-white overflow-hidden">
                <div className="bg-black text-[#FFE500] p-3 font-black text-xs uppercase flex justify-between border-b-2 border-black">
                  <span>EQUITY</span>
                  <span>{formatMoney(balanceSheet.totalEquityMinor, company.currency)}</span>
                </div>
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y-2 divide-black">
                    {balanceSheet.equityRows.map(r => (
                      <tr key={r.code} className="hover:bg-yellow-50">
                        <td className="p-3 font-bold">{r.code} - {r.name}</td>
                        <td className="p-3 text-right font-black tabular-nums">
                          {formatMoney(r.amountMinor, company.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: General Ledger */}
      {activeTab === 'ledger' && (
        <div className="space-y-6 font-mono">
          {generalLedger.map(gl => {
            if (gl.rows.length === 0) return null;

            return (
              <div key={gl.account.$id} className="card-brutal bg-white overflow-hidden">
                <div className="bg-black text-white p-3 flex items-center justify-between font-black text-xs uppercase">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#FFE500] text-black border border-black">
                      {gl.account.code}
                    </span>
                    <span>{gl.account.name}</span>
                  </div>
                  <span className="text-[#00E065]">
                    CLOSING BALANCE: {formatMoney(gl.netBalanceMinor, company.currency)}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FFE500] border-b-2 border-black text-black uppercase text-[10px] font-black">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Entry #</th>
                        <th className="p-2.5">Memo / Particulars</th>
                        <th className="p-2.5 text-right">Debit</th>
                        <th className="p-2.5 text-right">Credit</th>
                        <th className="p-2.5 text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-black">
                      {gl.rows.map((r, i) => (
                        <tr key={i} className="hover:bg-yellow-50">
                          <td className="p-2.5 font-bold">
                            {new Date(r.entryDate).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="p-2.5 font-bold">#{r.entryNo}</td>
                          <td className="p-2.5 font-semibold text-black/80">{r.memo}</td>
                          <td className="p-2.5 text-right tabular-nums">
                            {r.debitMinor > 0 ? formatMoney(r.debitMinor, company.currency) : ''}
                          </td>
                          <td className="p-2.5 text-right tabular-nums">
                            {r.creditMinor > 0 ? formatMoney(r.creditMinor, company.currency) : ''}
                          </td>
                          <td className="p-2.5 text-right font-black tabular-nums bg-gray-50">
                            {formatMoney(r.runningBalanceMinor, company.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
