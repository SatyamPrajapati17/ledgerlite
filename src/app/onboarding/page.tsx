'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LedgerStore } from '@/lib/storage/store';
import { Building2, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState('Apex Global Inc');
  const [legalName, setLegalName] = useState('Apex Global Technologies Pvt. Ltd.');
  const [currency, setCurrency] = useState('INR');
  const [fiscalMonth, setFiscalMonth] = useState(4);
  const [taxLabel, setTaxLabel] = useState('GST');
  const [loadTemplates, setLoadTemplates] = useState(true);
  const [loadDemoData, setLoadDemoData] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const companyId = `comp_${Date.now()}`;

    LedgerStore.updateCompany({
      $id: companyId,
      name,
      legalName,
      currency,
      fiscalYearStartMonth: Number(fiscalMonth),
      taxLabel,
    });

    if (loadDemoData) {
      LedgerStore.resetAndSeed(companyId);
    } else if (loadTemplates) {
      LedgerStore.loadTemplateAccountsOnly(companyId);
    }

    router.push('/');
  };

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6 font-mono">
      <div className="text-center space-y-2">
        <span className="px-2.5 py-0.5 bg-[#FFE500] text-black font-black text-xs border-2 border-black">
          FIRST-TIME COMPANY SETUP
        </span>
        <h1 className="font-display font-black text-3xl uppercase tracking-tight text-black">
          SET UP YOUR COMPANY LEDGER
        </h1>
        <p className="text-xs text-black/70">
          Takes under 30 seconds. Configures your company workspace, accounts, and ledger.
        </p>
      </div>

      <div className="card-brutal p-6 bg-white shadow-[6px_6px_0px_#000000]">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-black uppercase text-black/70 mb-1">
              COMPANY DISPLAY NAME
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-2.5 border-2 border-black font-bold bg-[#FFFDF5] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-black uppercase text-black/70 mb-1">
              LEGAL BUSINESS NAME (PRINTED ON INVOICES)
            </label>
            <input
              type="text"
              value={legalName}
              onChange={e => setLegalName(e.target.value)}
              className="w-full p-2.5 border-2 border-black font-bold bg-[#FFFDF5] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-black uppercase text-black/70 mb-1">
                OPERATING CURRENCY
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full p-2.5 border-2 border-black font-bold bg-[#FFFDF5] focus:outline-none"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="block font-black uppercase text-black/70 mb-1">
                TAX LABEL
              </label>
              <input
                type="text"
                value={taxLabel}
                onChange={e => setTaxLabel(e.target.value)}
                className="w-full p-2.5 border-2 border-black font-bold bg-[#FFFDF5] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-black uppercase text-black/70 mb-1">
              FINANCIAL YEAR START
            </label>
            <select
              value={fiscalMonth}
              onChange={e => setFiscalMonth(Number(e.target.value))}
              className="w-full p-2.5 border-2 border-black font-bold bg-[#FFFDF5] focus:outline-none"
            >
              <option value={1}>January 1st (Calendar Year)</option>
              <option value={4}>April 1st (Indian Fiscal Year)</option>
              <option value={7}>July 1st</option>
              <option value={10}>October 1st</option>
            </select>
          </div>

          {/* Preset Toggles */}
          <div className="border-2 border-black p-4 bg-[#FFFDF5] space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={loadTemplates}
                onChange={e => setLoadTemplates(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-black border-2 border-black"
              />
              <div>
                <span className="font-black text-black">Load 21 Standard Chart of Accounts</span>
                <p className="text-black/60 text-[11px]">
                  Includes Assets (Bank, AR, Cash), Liabilities, Equity, Revenue, and 9 standard Expense accounts.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={loadDemoData}
                onChange={e => setLoadDemoData(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-black border-2 border-black"
              />
              <div>
                <span className="font-black text-black">Pre-seed 40 Realistic Transactions</span>
                <p className="text-black/60 text-[11px]">
                  Populates 30 days of balanced sales, payments, expenses, and invoices for instant demo.
                </p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            className="btn-brutal bg-[#00E065] text-black w-full py-3.5 font-black text-sm flex items-center justify-center gap-2 hover:bg-[#00c95a]"
          >
            <span>LAUNCH COMPANY WORKSPACE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
