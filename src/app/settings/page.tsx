'use client';

import React, { useState, useEffect } from 'react';
import { LedgerStore } from '@/lib/storage/store';
import { Company } from '@/lib/types';
import { isAppwriteConfigured } from '@/lib/appwrite/config';
import { IntegrityCheckModal } from '@/components/IntegrityCheckModal';
import { 
  Settings as SettingsIcon, Database, ShieldCheck, RefreshCw, 
  Terminal, CheckCircle2, AlertTriangle, Key, ExternalLink, Copy, Check
} from 'lucide-react';

export default function SettingsPage() {
  const [company, setCompany] = useState<Company>(LedgerStore.getCompany());
  const [hasAppwrite, setHasAppwrite] = useState(false);
  const [showIntegrity, setShowIntegrity] = useState(false);
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(company.name);
  const [legalName, setLegalName] = useState(company.legalName || '');
  const [currency, setCurrency] = useState(company.currency);
  const [fiscalMonth, setFiscalMonth] = useState(company.fiscalYearStartMonth);
  const [taxLabel, setTaxLabel] = useState(company.taxLabel || 'GST');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setHasAppwrite(isAppwriteConfigured());
    const c = LedgerStore.getCompany();
    setCompany(c);
    setName(c.name);
    setLegalName(c.legalName || '');
    setCurrency(c.currency);
    setFiscalMonth(c.fiscalYearStartMonth);
    setTaxLabel(c.taxLabel || 'GST');
  }, []);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    LedgerStore.updateCompany({
      name,
      legalName,
      currency,
      fiscalYearStartMonth: Number(fiscalMonth),
      taxLabel,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetAndSeed = () => {
    if (confirm('This will reload the ledger with 40 realistic transactions, sales invoices, client payments, and balanced accounts. Proceed?')) {
      LedgerStore.resetAndSeed(company.$id);
      window.location.reload();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(id);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <div className="space-y-8 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <div>
          <span className="px-2 py-0.5 bg-[#FFE500] text-black font-black text-xs border-2 border-black">
            CONFIGURATION & APPWRITE CLOUD
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-black uppercase tracking-tight mt-1">
            SETTINGS & DATABASE
          </h1>
        </div>

        <button
          onClick={() => setShowIntegrity(true)}
          className="btn-brutal bg-[#FF2A2A] text-white px-4 py-2 text-xs flex items-center gap-1.5 hover:bg-[#C71010]"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>RUN INTEGRITY CHECK</span>
        </button>
      </div>

      {/* Appwrite Status Banner */}
      <div className={`card-brutal p-5 ${hasAppwrite ? 'bg-[#00E065]' : 'bg-[#FFE500]'}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-black shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-xl text-black uppercase">
                  {hasAppwrite ? 'APPWRITE TABLESDB CONNECTED' : 'LOCAL MOCK APPWRITE ACTIVE'}
                </span>
                <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold">
                  {hasAppwrite ? 'CLOUD LIVE' : 'LOCAL STORAGE'}
                </span>
              </div>
              <p className="text-xs text-black/80 font-bold mt-0.5">
                {hasAppwrite
                  ? 'All writes route to Appwrite TablesDB transactions, atomic increments, and Realtime channels.'
                  : 'Currently running on the local reactive accounting engine. Follow the step-by-step guide below to connect your Appwrite Cloud Database.'}
              </p>
            </div>
          </div>

          <a
            href="https://cloud.appwrite.io"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-brutal bg-black text-white px-4 py-2 text-xs flex items-center gap-1.5 hover:bg-gray-800 shrink-0"
          >
            <span>APPWRITE CONSOLE</span>
            <ExternalLink className="w-3.5 h-3.5 text-yellow-300" />
          </a>
        </div>
      </div>

      {/* STEP-BY-STEP APPWRITE DATABASE GUIDE */}
      <div className="card-brutal bg-white overflow-hidden">
        <div className="bg-black text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#FFE500]" />
            <h2 className="font-display font-black text-lg uppercase tracking-tight">
              STEP-BY-STEP GUIDE: CONNECT APPWRITE DATABASE
            </h2>
          </div>
          <span className="px-2 py-0.5 bg-[#FFE500] text-black font-black text-[11px] border border-black">
            SETUP WIZARD
          </span>
        </div>

        <div className="p-6 space-y-6 text-xs">
          {/* Step 1 */}
          <div className="border-2 border-black p-4 bg-[#FFFDF5] shadow-[2px_2px_0px_#000000] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-[#FF2A2A]">
                STEP 1: CREATE PROJECT AT APPWRITE CLOUD
              </span>
              <a
                href="https://cloud.appwrite.io"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-black underline flex items-center gap-1"
              >
                Open cloud.appwrite.io <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-black/80">
              Sign in to Appwrite Cloud and click <strong>Create Project</strong>. Name it <code className="bg-yellow-200 px-1 py-0.5 border border-black font-bold">LedgerLite</code>. Once created, copy the <strong>Project ID</strong> from your project overview.
            </p>
          </div>

          {/* Step 2 */}
          <div className="border-2 border-black p-4 bg-[#FFFDF5] shadow-[2px_2px_0px_#000000] space-y-2">
            <span className="font-black text-sm text-[#FF2A2A]">
              STEP 2: ADD WEB PLATFORM (LOCALHOST)
            </span>
            <p className="text-black/80">
              In your Appwrite Console under <strong>Integrations & Platforms</strong>, click <strong>Add Platform → Web App</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 text-black/90 pl-2">
              <li>Name: <code>LedgerLite Local</code></li>
              <li>Hostname: <code>localhost</code> (or <code>127.0.0.1</code>)</li>
            </ul>
          </div>

          {/* Step 3 */}
          <div className="border-2 border-black p-4 bg-[#FFFDF5] shadow-[2px_2px_0px_#000000] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-[#FF2A2A]">
                STEP 3: CONFIGURE .env.local
              </span>
              <button
                onClick={() => copyToClipboard(`NEXT_PUBLIC_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1\nNEXT_PUBLIC_APPWRITE_PROJECT_ID=6ae4f8d4000fe676e1aa\nNEXT_PUBLIC_APPWRITE_DATABASE_ID=ledger`, 'env')}
                className="px-2 py-1 bg-white border border-black font-bold text-[10px] flex items-center gap-1 hover:bg-black hover:text-white"
              >
                {copiedStep === 'env' ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                {copiedStep === 'env' ? 'COPIED' : 'COPY SNIPPET'}
              </button>
            </div>
            <p className="text-black/80">
              Open <code>.env.local</code> in this project directory (pre-configured with your project credentials):
            </p>
            <pre className="bg-black text-yellow-300 p-3 overflow-x-auto text-[11px] border border-black">
{`NEXT_PUBLIC_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=6ae4f8d4000fe676e1aa
NEXT_PUBLIC_APPWRITE_DATABASE_ID=ledger`}
            </pre>
          </div>

          {/* Step 4 */}
          <div className="border-2 border-black p-4 bg-[#FFFDF5] shadow-[2px_2px_0px_#000000] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-[#FF2A2A]">
                STEP 4: PUSH DATABASE SCHEMA VIA APPWRITE CLI
              </span>
              <button
                onClick={() => copyToClipboard(`npx appwrite push tables`, 'cli')}
                className="px-2 py-1 bg-white border border-black font-bold text-[10px] flex items-center gap-1 hover:bg-black hover:text-white"
              >
                {copiedStep === 'cli' ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                {copiedStep === 'cli' ? 'COPIED' : 'COPY COMMAND'}
              </button>
            </div>
            <p className="text-black/80">
              LedgerLite comes with <code>appwrite.json</code> pre-configured with all 10 tables, relational columns, unique & fulltext indexes, and row-level permissions. In terminal, run:
            </p>
            <pre className="bg-black text-green-400 p-2 text-xs border border-black">
npx appwrite push tables
            </pre>
            <p className="text-black/70 text-[11px]">
              This automatically creates the database <code>ledger</code> with tables <code>companies</code>, <code>accounts</code>, <code>journalEntries</code>, <code>journalLines</code>, <code>contacts</code>, <code>invoices</code>, <code>invoiceItems</code>, <code>payments</code>, <code>counters</code>, and <code>auditLog</code>.
            </p>
          </div>

          {/* Step 5 */}
          <div className="border-2 border-black p-4 bg-[#00E065] text-black shadow-[2px_2px_0px_#000000] space-y-1">
            <span className="font-black text-sm">
              STEP 5: READY & RUNNING
            </span>
            <p className="font-bold">
              Restart <code>npm run dev</code>. The navbar pill will turn green: <strong>APPWRITE CONNECTED</strong>! All journal entries, invoices, and payments commit via real Appwrite TablesDB transactions.
            </p>
          </div>
        </div>
      </div>

      {/* Company Settings Form */}
      <div className="card-brutal p-6 bg-white space-y-4">
        <div className="border-b-2 border-black pb-2 flex items-center justify-between">
          <h2 className="font-display font-black text-xl text-black uppercase">
            COMPANY PROFILE & FISCAL SETTINGS
          </h2>
          {savedSuccess && (
            <span className="px-2 py-1 bg-[#00E065] text-black text-xs font-black border border-black">
              ✓ SAVED SUCCESSFULLY
            </span>
          )}
        </div>

        <form onSubmit={handleSaveCompany} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-black uppercase text-black/70 mb-1">
              Display Company Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border-2 border-black p-2 font-bold bg-[#FFFDF5] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-black uppercase text-black/70 mb-1">
              Legal Business Name (For Invoices)
            </label>
            <input
              type="text"
              value={legalName}
              onChange={e => setLegalName(e.target.value)}
              className="w-full border-2 border-black p-2 font-bold bg-[#FFFDF5] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-black uppercase text-black/70 mb-1">
              Base Operating Currency
            </label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full border-2 border-black p-2 font-bold bg-[#FFFDF5] focus:outline-none"
            >
              <option value="INR">INR (₹ Indian Rupee)</option>
              <option value="USD">USD ($ United States Dollar)</option>
              <option value="EUR">EUR (€ Euro)</option>
              <option value="GBP">GBP (£ British Pound)</option>
            </select>
          </div>

          <div>
            <label className="block font-black uppercase text-black/70 mb-1">
              Fiscal Year Start Month
            </label>
            <select
              value={fiscalMonth}
              onChange={e => setFiscalMonth(parseInt(e.target.value))}
              className="w-full border-2 border-black p-2 font-bold bg-[#FFFDF5] focus:outline-none"
            >
              <option value={1}>January (Calendar Year)</option>
              <option value={4}>April (Indian Financial Year)</option>
              <option value={7}>July</option>
              <option value={10}>October</option>
            </select>
          </div>

          <div>
            <label className="block font-black uppercase text-black/70 mb-1">
              Tax Label on Invoices
            </label>
            <input
              type="text"
              value={taxLabel}
              onChange={e => setTaxLabel(e.target.value)}
              className="w-full border-2 border-black p-2 font-bold bg-[#FFFDF5] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 pt-2 flex justify-end">
            <button
              type="submit"
              className="btn-brutal bg-[#FFE500] text-black px-6 py-2.5 text-xs hover:bg-yellow-300"
            >
              SAVE COMPANY PREFERENCES
            </button>
          </div>
        </form>
      </div>

      {/* Dangerous / Demo Zone */}
      <div className="card-brutal p-6 bg-[#FFFDF5] border-3 border-black space-y-4">
        <div className="border-b-2 border-black pb-2 flex items-center gap-2 text-[#FF2A2A]">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="font-display font-black text-xl text-black uppercase">
            DEMO SEEDING & RESET
          </h2>
        </div>

        <p className="text-xs text-black/80">
          Want to populate a complete, realistic 30-day activity profile for the demo video or testing? Click below to reload the 21 chart of accounts, 5 customers/vendors, balanced sales invoices, payments, and expenses.
        </p>

        <button
          onClick={handleResetAndSeed}
          className="btn-brutal bg-[#FF2A2A] text-white px-5 py-2.5 text-xs flex items-center gap-2 hover:bg-[#C71010]"
        >
          <RefreshCw className="w-4 h-4" />
          <span>RE-SEED DEMO FINANCIAL DATA</span>
        </button>
      </div>

      {/* Integrity Modal */}
      <IntegrityCheckModal
        isOpen={showIntegrity}
        onClose={() => setShowIntegrity(false)}
      />
    </div>
  );
}
