'use client';

import React, { useState, useEffect } from 'react';
import { LedgerStore } from '@/lib/storage/store';
import { Account, AccountType, NormalSide } from '@/lib/types';
import { formatMoney } from '@/lib/money';
import { PlusCircle, Download, CheckCircle2, XCircle, Search, Sparkles, X } from 'lucide-react';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [company, setCompany] = useState(LedgerStore.getCompany());
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Account form state
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AccountType>('asset');
  const [newNormalSide, setNewNormalSide] = useState<NormalSide>('debit');
  const [newSystemKey, setNewSystemKey] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refresh = () => {
    setAccounts(LedgerStore.getAccounts());
    setCompany(LedgerStore.getCompany());
  };

  useEffect(() => {
    refresh();
    const unsub = LedgerStore.subscribe(refresh);
    return unsub;
  }, []);

  const handleToggleActive = (id: string) => {
    try {
      LedgerStore.toggleAccountActive(id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLoadTemplates = () => {
    if (confirm('Load standard 21 double-entry accounts template?')) {
      LedgerStore.loadTemplateAccountsOnly(company.$id);
    }
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      LedgerStore.addAccount({
        companyId: company.$id,
        code: newCode.trim(),
        name: newName.trim(),
        type: newType,
        normalSide: newNormalSide,
        systemKey: newSystemKey.trim() || undefined,
        isActive: true,
      });
      setShowAddModal(false);
      setNewCode('');
      setNewName('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account');
    }
  };

  const accountTypes: { key: AccountType; label: string; bg: string; text: string }[] = [
    { key: 'asset', label: '1. ASSETS', bg: 'bg-[#FFE500]', text: 'text-black' },
    { key: 'liability', label: '2. LIABILITIES', bg: 'bg-[#FF2A2A]', text: 'text-white' },
    { key: 'equity', label: '3. EQUITY', bg: 'bg-black', text: 'text-[#FFE500]' },
    { key: 'income', label: '4. INCOME / REVENUE', bg: 'bg-[#00E065]', text: 'text-black' },
    { key: 'expense', label: '5. OPERATING EXPENSES', bg: 'bg-[#FFE500]', text: 'text-black' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <div>
          <span className="px-2 py-0.5 bg-[#FFE500] text-black font-black text-xs border-2 border-black font-mono">
            CHART OF ACCOUNTS
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-black uppercase tracking-tight mt-1">
            GENERAL LEDGER ACCOUNTS
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadTemplates}
            className="btn-brutal bg-white text-black px-4 py-2 text-xs flex items-center gap-1.5 hover:bg-yellow-200"
          >
            <Download className="w-4 h-4 text-black" />
            <span>LOAD 21 TEMPLATES</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-brutal bg-[#FF2A2A] text-white px-4 py-2 text-xs flex items-center gap-1.5 hover:bg-[#C71010]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ADD ACCOUNT</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card-brutal p-3 bg-white flex items-center gap-3 font-mono text-xs">
        <Search className="w-4 h-4 text-black/50 ml-1" />
        <input
          type="text"
          placeholder="Filter accounts by code, name, type or system key..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full font-bold focus:outline-none"
        />
      </div>

      {/* Account Groups */}
      <div className="space-y-6 font-mono">
        {accountTypes.map(group => {
          const groupAccounts = accounts.filter(
            a =>
              a.type === group.key &&
              (a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.code.includes(searchTerm) ||
                (a.systemKey && a.systemKey.includes(searchTerm.toLowerCase())))
          );

          if (groupAccounts.length === 0) return null;

          return (
            <div key={group.key} className="card-brutal bg-white overflow-hidden">
              <div className={`${group.bg} ${group.text} border-b-3 border-black p-3.5 flex items-center justify-between font-black text-xs uppercase tracking-wider`}>
                <span className="text-sm">{group.label}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 border border-black bg-white text-black">
                  {groupAccounts.length} ACCOUNTS
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFFDF5] border-b-2 border-black text-black/70 uppercase text-[10px] font-black">
                    <tr>
                      <th className="p-3">Code</th>
                      <th className="p-3">Account Name</th>
                      <th className="p-3">Normal Side</th>
                      <th className="p-3">System Mapping</th>
                      <th className="p-3 text-right">Cached Balance</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black">
                    {groupAccounts.map(acc => {
                      // Sign rule: balanceMinor is total debits - total credits
                      // Display amount formatted according to normalSide
                      const displayBal = acc.normalSide === 'credit' ? -acc.balanceMinor : acc.balanceMinor;

                      return (
                        <tr key={acc.$id} className="hover:bg-yellow-50 transition-colors">
                          <td className="p-3 font-black text-sm">
                            <span className="px-2 py-0.5 bg-black text-[#FFE500] border border-black font-mono">
                              {acc.code}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-black text-sm">
                            {acc.name}
                          </td>
                          <td className="p-3 font-bold uppercase text-[10px]">
                            {acc.normalSide === 'debit' ? (
                              <span className="text-blue-700 bg-blue-100 px-1.5 py-0.5 border border-black">DEBIT</span>
                            ) : (
                              <span className="text-purple-700 bg-purple-100 px-1.5 py-0.5 border border-black">CREDIT</span>
                            )}
                          </td>
                          <td className="p-3 font-semibold text-black/60 text-[11px]">
                            {acc.systemKey ? (
                              <code className="px-1.5 py-0.5 bg-yellow-100 border border-black text-black font-bold text-[10px]">
                                {acc.systemKey}
                              </code>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="p-3 text-right font-black tabular-nums text-sm">
                            <span className={displayBal < 0 ? 'text-[#FF2A2A]' : 'text-black'}>
                              {formatMoney(displayBal, company.currency)}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {acc.isActive ? (
                              <span className="px-2 py-0.5 bg-[#00E065] text-black border border-black font-black text-[10px]">
                                ACTIVE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-gray-300 text-gray-700 border border-black font-black text-[10px]">
                                INACTIVE
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleToggleActive(acc.$id)}
                              className="px-2 py-1 bg-white border border-black font-bold text-[10px] hover:bg-black hover:text-white transition-all shadow-[1px_1px_0px_#000000]"
                            >
                              {acc.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="card-brutal bg-white w-full max-w-md p-6 space-y-4 shadow-[8px_8px_0px_#000000] font-mono">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <h3 className="font-display font-black text-xl text-black uppercase">
                NEW ACCOUNT
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 border border-black hover:bg-[#FF2A2A] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2 bg-[#FF2A2A] text-white border-2 border-black text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase text-black/70 mb-1">
                  Account Code (e.g. 5250)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5250"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  className="w-full border-2 border-black p-2 text-xs font-bold bg-[#FFFDF5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black/70 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Hosting & Servers"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full border-2 border-black p-2 text-xs font-bold bg-[#FFFDF5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black/70 mb-1">
                  Account Type
                </label>
                <select
                  value={newType}
                  onChange={e => {
                    const t = e.target.value as AccountType;
                    setNewType(t);
                    setNewNormalSide(t === 'asset' || t === 'expense' ? 'debit' : 'credit');
                  }}
                  className="w-full border-2 border-black p-2 text-xs font-bold bg-[#FFFDF5] focus:outline-none"
                >
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
                  <option value="equity">Equity</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black/70 mb-1">
                  Normal Side
                </label>
                <select
                  value={newNormalSide}
                  onChange={e => setNewNormalSide(e.target.value as NormalSide)}
                  className="w-full border-2 border-black p-2 text-xs font-bold bg-[#FFFDF5] focus:outline-none"
                >
                  <option value="debit">Debit (DR)</option>
                  <option value="credit">Credit (CR)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black/70 mb-1">
                  System Key (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. bank, cash, ar, ap, revenue"
                  value={newSystemKey}
                  onChange={e => setNewSystemKey(e.target.value)}
                  className="w-full border-2 border-black p-2 text-xs font-bold bg-[#FFFDF5] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-brutal bg-white text-black px-4 py-2 text-xs"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="btn-brutal bg-[#FFE500] text-black px-5 py-2 text-xs hover:bg-yellow-300"
                >
                  CREATE ACCOUNT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
