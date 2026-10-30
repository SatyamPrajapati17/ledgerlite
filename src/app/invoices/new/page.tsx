'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LedgerStore } from '@/lib/storage/store';
import { Contact, Account } from '@/lib/types';
import { formatMoney, parseMoneyToMinor } from '@/lib/money';
import { Plus, Trash2, ArrowLeft, Send, Sparkles, UserPlus } from 'lucide-react';
import confetti from 'canvas-confetti';

interface InvoiceFormItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceStr: string;
  taxRatePercent: number; // e.g. 18
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [company, setCompany] = useState(LedgerStore.getCompany());
  const [selectedContactId, setSelectedContactId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [items, setItems] = useState<InvoiceFormItem[]>([
    {
      id: '1',
      description: 'Enterprise Cloud Architecture Consulting',
      quantity: 1,
      unitPriceStr: '150000',
      taxRatePercent: 18,
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick Add Customer modal
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  useEffect(() => {
    setContacts(LedgerStore.getContacts().filter(c => c.kind === 'customer'));
    setCompany(LedgerStore.getCompany());
  }, []);

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: String(Date.now()),
        description: '',
        quantity: 1,
        unitPriceStr: '',
        taxRatePercent: 18,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('An invoice must contain at least one item.');
      return;
    }
    setItems(items.filter((_, idx) => idx !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceFormItem, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Computations
  let subtotalMinor = 0;
  let taxMinor = 0;

  items.forEach(it => {
    const unitPriceMinor = parseMoneyToMinor(it.unitPriceStr);
    const lineSub = Math.round(it.quantity * unitPriceMinor);
    const lineTax = Math.round((lineSub * it.taxRatePercent * 100) / 10000);
    subtotalMinor += lineSub;
    taxMinor += lineTax;
  });

  const totalMinor = subtotalMinor + taxMinor;

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    const c = LedgerStore.createContact({
      companyId: company.$id,
      kind: 'customer',
      name: newCustName.trim(),
      email: newCustEmail.trim() || undefined,
    });
    setContacts(LedgerStore.getContacts().filter(x => x.kind === 'customer'));
    setSelectedContactId(c.$id);
    setShowAddCustomer(false);
    setNewCustName('');
    setNewCustEmail('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedContactId) {
      setErrorMsg('Please select a customer.');
      return;
    }

    if (totalMinor <= 0) {
      setErrorMsg('Invoice total must be greater than zero.');
      return;
    }

    try {
      setSaving(true);
      const invoiceItems = items.map(it => ({
        description: it.description || 'Standard service item',
        quantity: Number(it.quantity) || 1,
        unitPriceMinor: parseMoneyToMinor(it.unitPriceStr),
        taxRateBp: Math.round(it.taxRatePercent * 100),
      }));

      const newInv = LedgerStore.createAndPostInvoice({
        companyId: company.$id,
        contactId: selectedContactId,
        issueDate: new Date(issueDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        items: invoiceItems,
      });

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#FFE500', '#FF2A2A', '#00E065', '#000000'],
        });
      } catch {}

      setTimeout(() => {
        router.push(`/invoices/${newInv.$id}`);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save invoice');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b-4 border-black pb-4">
        <div>
          <Link
            href="/invoices"
            className="text-xs font-mono font-bold flex items-center gap-1 text-black/70 hover:text-black mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> BACK TO INVOICES
          </Link>
          <h1 className="font-display font-black text-3xl text-black uppercase tracking-tight">
            CREATE & AUTO-POST INVOICE
          </h1>
        </div>

        <div className="px-3 py-1 bg-[#FFE500] border-2 border-black font-mono text-xs font-black">
          ATOMIC TRANSACTIONS
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-[#FF2A2A] text-white border-3 border-black font-mono text-xs font-black shadow-[3px_3px_0px_#000000]">
          ⚠ ERROR: {errorMsg}
        </div>
      )}

      {/* Transaction Blueprint Explainer */}
      <div className="card-brutal p-4 bg-[#FFFDF5] font-mono text-xs space-y-2">
        <div className="flex items-center gap-1.5 font-black text-black">
          <Sparkles className="w-4 h-4 text-[#FF2A2A]" />
          <span>TABLESDB AUTO-POSTING BLUEPRINT</span>
        </div>
        <p className="text-black/80">
          When you click Save, Appwrite TablesDB executes one atomic multi-table transaction that creates the invoice, its line items, and a linked balanced journal entry (<strong>Debit 1100 AR</strong>, <strong>Credit 4000 Sales Revenue</strong>, <strong>Credit 2100 Tax Payable</strong>) while updating account balances in one shot!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 font-mono">
        {/* Customer & Dates Section */}
        <div className="card-brutal p-5 bg-white grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-black uppercase text-black/70">
                CUSTOMER
              </label>
              <button
                type="button"
                onClick={() => setShowAddCustomer(true)}
                className="text-[10px] text-[#FF2A2A] font-bold hover:underline flex items-center gap-0.5"
              >
                <UserPlus className="w-3 h-3" /> + NEW CUSTOMER
              </button>
            </div>
            <select
              required
              value={selectedContactId}
              onChange={e => setSelectedContactId(e.target.value)}
              className="w-full border-2 border-black p-2 text-xs font-bold bg-[#FFFDF5] focus:outline-none"
            >
              <option value="">-- Choose Customer --</option>
              {contacts.map(c => (
                <option key={c.$id} value={c.$id}>
                  {c.name} {c.taxId ? `(${c.taxId})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-black/70 mb-1">
              ISSUE DATE
            </label>
            <input
              type="date"
              required
              value={issueDate}
              onChange={e => setIssueDate(e.target.value)}
              className="w-full border-2 border-black p-2 text-xs font-bold bg-[#FFFDF5] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-black/70 mb-1">
              PAYMENT DUE DATE
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full border-2 border-black p-2 text-xs font-bold bg-[#FFFDF5] focus:outline-none"
            />
          </div>
        </div>

        {/* Line Items Table */}
        <div className="card-brutal bg-white overflow-hidden">
          <div className="bg-black text-white p-3 flex items-center justify-between text-xs font-black">
            <span>INVOICE LINE ITEMS</span>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-2 py-1 bg-[#FFE500] text-black border border-black hover:bg-yellow-300 flex items-center gap-1 font-bold text-[11px]"
            >
              <Plus className="w-3.5 h-3.5" /> ADD ITEM
            </button>
          </div>

          <div className="p-4 space-y-3">
            {items.map((it, idx) => (
              <div
                key={it.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center border-2 border-black p-2.5 bg-[#FFFDF5] shadow-[2px_2px_0px_#000000]"
              >
                {/* Description (5 cols) */}
                <div className="md:col-span-5">
                  <label className="text-[10px] font-black uppercase text-black/60 block md:hidden">
                    Description
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Description of goods or services"
                    value={it.description}
                    onChange={e => updateItem(idx, 'description', e.target.value)}
                    className="w-full border-2 border-black p-1.5 text-xs font-bold bg-white focus:outline-none"
                  />
                </div>

                {/* Quantity (2 cols) */}
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-black/60 block md:hidden">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={it.quantity}
                    onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                    className="w-full border-2 border-black p-1.5 text-xs font-bold bg-white text-center focus:outline-none"
                  />
                </div>

                {/* Unit Price (3 cols) */}
                <div className="md:col-span-3">
                  <label className="text-[10px] font-black uppercase text-black/60 block md:hidden">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="Unit price (₹)"
                    value={it.unitPriceStr}
                    onChange={e => updateItem(idx, 'unitPriceStr', e.target.value)}
                    className="w-full border-2 border-black p-1.5 text-xs font-bold bg-white text-right focus:outline-none"
                  />
                </div>

                {/* Tax Rate (2 cols) */}
                <div className="md:col-span-2 flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase text-black/60 block md:hidden">
                      Tax %
                    </label>
                    <select
                      value={it.taxRatePercent}
                      onChange={e => updateItem(idx, 'taxRatePercent', parseFloat(e.target.value))}
                      className="w-full border-2 border-black p-1.5 text-xs font-bold bg-white focus:outline-none"
                    >
                      <option value={0}>0% (Exempt)</option>
                      <option value={5}>5% GST</option>
                      <option value={12}>12% GST</option>
                      <option value={18}>18% GST</option>
                      <option value={28}>28% GST</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className="p-1.5 border border-black text-[#FF2A2A] hover:bg-[#FF2A2A] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals & Submit Section */}
          <div className="p-5 bg-gray-50 border-t-2 border-black flex flex-col md:flex-row items-center justify-between gap-6">
            <button
              type="button"
              onClick={handleAddItem}
              className="btn-brutal bg-white text-black px-4 py-2 text-xs flex items-center gap-1.5 hover:bg-yellow-200"
            >
              <Plus className="w-4 h-4" /> ADD ITEM
            </button>

            {/* Calculations Box */}
            <div className="w-full md:w-80 space-y-2 border-2 border-black p-3 bg-white shadow-[3px_3px_0px_#000000]">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-black/70">Subtotal:</span>
                <span className="tabular-nums font-black">{formatMoney(subtotalMinor, company.currency)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-black/70">GST / Output Tax:</span>
                <span className="tabular-nums font-black">{formatMoney(taxMinor, company.currency)}</span>
              </div>
              <div className="border-t-2 border-black pt-2 flex justify-between text-sm font-black bg-yellow-100 p-1">
                <span>Total Due:</span>
                <span className="tabular-nums">{formatMoney(totalMinor, company.currency)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#FFE500] border-t-2 border-black flex justify-end">
            <button
              type="submit"
              disabled={saving || totalMinor <= 0}
              className="btn-brutal bg-[#FF2A2A] text-white px-8 py-3 text-sm flex items-center gap-2 hover:bg-[#C71010]"
            >
              <Send className="w-4 h-4" />
              {saving ? 'COMMITTING INVOICE & JOURNAL...' : 'SAVE & AUTO-POST INVOICE'}
            </button>
          </div>
        </div>
      </form>

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="card-brutal bg-white w-full max-w-md p-6 space-y-4 shadow-[8px_8px_0px_#000000] font-mono">
            <h3 className="font-display font-black text-xl text-black uppercase">
              ADD NEW CUSTOMER
            </h3>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase text-black/70 mb-1">
                  Customer / Business Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  className="w-full border-2 border-black p-2 text-xs font-bold bg-[#FFFDF5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black/70 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="billing@acme.com"
                  value={newCustEmail}
                  onChange={e => setNewCustEmail(e.target.value)}
                  className="w-full border-2 border-black p-2 text-xs font-bold bg-[#FFFDF5] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="btn-brutal bg-white text-black px-4 py-2 text-xs"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="btn-brutal bg-[#FFE500] text-black px-5 py-2 text-xs hover:bg-yellow-300"
                >
                  SAVE CUSTOMER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
