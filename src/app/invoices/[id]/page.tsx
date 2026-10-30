'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LedgerStore } from '@/lib/storage/store';
import { Invoice, Payment, Account } from '@/lib/types';
import { formatMoney, parseMoneyToMinor } from '@/lib/money';
import { ArrowLeft, CreditCard, CheckCircle2, AlertTriangle, ArrowRight, X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params?.id as string;

  const [invoice, setInvoice] = useState<Invoice | undefined>(undefined);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cashAccounts, setCashAccounts] = useState<Account[]>([]);
  const [company, setCompany] = useState(LedgerStore.getCompany());

  // Record Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmountStr, setPaymentAmountStr] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'upi' | 'card' | 'cash'>('bank');
  const [selectedCashAccountId, setSelectedCashAccountId] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [recording, setRecording] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refresh = () => {
    const inv = LedgerStore.getInvoiceById(invoiceId);
    setInvoice(inv);
    if (inv) {
      const allPays = LedgerStore.getState().payments.filter(p => p.invoiceId === invoiceId);
      setPayments(allPays);
      const remainingMinor = inv.totalMinor - inv.paidMinor;
      setPaymentAmountStr((remainingMinor / 100).toFixed(2));
    }
    const accts = LedgerStore.getAccounts().filter(
      a => a.systemKey === 'bank' || a.systemKey === 'cash' || a.code === '1010' || a.code === '1000'
    );
    setCashAccounts(accts);
    if (accts.length > 0 && !selectedCashAccountId) {
      setSelectedCashAccountId(accts[0].$id);
    }
    setCompany(LedgerStore.getCompany());
  };

  useEffect(() => {
    refresh();
    const unsub = LedgerStore.subscribe(refresh);
    return unsub;
  }, [invoiceId]);

  if (!invoice) {
    return (
      <div className="card-brutal p-8 text-center bg-white space-y-4 font-mono">
        <p className="font-black text-lg">Invoice not found.</p>
        <Link href="/invoices" className="btn-brutal bg-[#FFE500] text-black px-4 py-2 text-xs inline-block">
          RETURN TO INVOICES
        </Link>
      </div>
    );
  }

  const remainingOwed = invoice.totalMinor - invoice.paidMinor;
  const isFullyPaid = invoice.status === 'paid' || remainingOwed <= 0;

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const amountMinor = parseMoneyToMinor(paymentAmountStr);
    if (amountMinor <= 0) {
      setErrorMsg('Payment amount must be greater than zero.');
      return;
    }

    if (amountMinor > remainingOwed) {
      setErrorMsg(`Payment cannot exceed outstanding balance of ₹${(remainingOwed / 100).toFixed(2)}.`);
      return;
    }

    if (!selectedCashAccountId) {
      setErrorMsg('Please choose the receiving bank or cash account.');
      return;
    }

    try {
      setRecording(true);
      LedgerStore.recordPayment({
        invoiceId: invoice.$id,
        paymentDate: new Date(paymentDate).toISOString(),
        amountMinor,
        method: paymentMethod,
        cashAccountId: selectedCashAccountId,
        reference: paymentRef.trim() || undefined,
      });

      setShowPaymentModal(false);
      setRecording(false);

      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#00E065', '#FFE500', '#000000', '#FF2A2A'],
        });
      } catch {}
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record payment');
      setRecording(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <div>
          <Link
            href="/invoices"
            className="text-xs font-mono font-bold flex items-center gap-1 text-black/70 hover:text-black mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> BACK TO INVOICES
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-black text-3xl sm:text-4xl text-black uppercase tracking-tight">
              INVOICE {invoice.number}
            </h1>
            {isFullyPaid ? (
              <span className="px-2.5 py-1 bg-[#00E065] text-black font-mono font-black text-xs border-2 border-black">
                PAID IN FULL
              </span>
            ) : invoice.status === 'partial' ? (
              <span className="px-2.5 py-1 bg-[#FFE500] text-black font-mono font-black text-xs border-2 border-black">
                PARTIALLY PAID
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-black text-white font-mono font-black text-xs border-2 border-black">
                UNPAID
              </span>
            )}
          </div>
        </div>

        {!isFullyPaid && (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="btn-brutal bg-[#00E065] text-black px-5 py-2.5 text-xs flex items-center gap-2 hover:bg-[#00c95a]"
          >
            <CreditCard className="w-4 h-4" />
            <span>RECORD PAYMENT</span>
          </button>
        )}
      </div>

      {/* Meta Card */}
      <div className="card-brutal p-5 bg-white grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div>
          <span className="font-black uppercase text-black/60 block">BILLED TO</span>
          <span className="font-bold text-sm text-black">{invoice.contactName}</span>
        </div>

        <div>
          <span className="font-black uppercase text-black/60 block">ISSUE DATE</span>
          <span className="font-bold text-sm text-black">
            {new Date(invoice.issueDate).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        <div>
          <span className="font-black uppercase text-black/60 block">DUE DATE</span>
          <span className="font-bold text-sm text-black">
            {new Date(invoice.dueDate).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        <div>
          <span className="font-black uppercase text-black/60 block">POSTED JOURNAL ENTRY</span>
          {invoice.entryId ? (
            <Link
              href={`/journal/${invoice.entryId}`}
              className="text-[#FF2A2A] font-black underline hover:text-black flex items-center gap-1 mt-0.5"
            >
              <span>VIEW ENTRY</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          ) : (
            <span className="text-gray-400">N/A</span>
          )}
        </div>
      </div>

      {/* Line Items Table */}
      <div className="card-brutal bg-white overflow-hidden">
        <div className="bg-black text-white p-3 font-mono font-black text-xs uppercase">
          INVOICED LINE ITEMS
        </div>

        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#FFE500] border-b-2 border-black text-black uppercase text-[11px]">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Item Description</th>
              <th className="p-3 text-center">Qty</th>
              <th className="p-3 text-right">Unit Price</th>
              <th className="p-3 text-center">GST %</th>
              <th className="p-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black">
            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((it, idx) => (
                <tr key={it.$id || idx} className="hover:bg-yellow-50">
                  <td className="p-3 font-bold">{idx + 1}</td>
                  <td className="p-3 font-bold text-black">{it.description}</td>
                  <td className="p-3 text-center font-bold">{it.quantity}</td>
                  <td className="p-3 text-right tabular-nums">
                    {formatMoney(it.unitPriceMinor, company.currency)}
                  </td>
                  <td className="p-3 text-center font-bold">
                    {(it.taxRateBp / 100).toFixed(0)}%
                  </td>
                  <td className="p-3 text-right font-black tabular-nums">
                    {formatMoney(it.lineSubtotalMinor, company.currency)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  Standard service package
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Invoice Totals Summary */}
        <div className="p-5 bg-gray-50 border-t-4 border-black flex justify-end font-mono">
          <div className="w-full sm:w-80 space-y-2 text-xs">
            <div className="flex justify-between font-bold">
              <span className="text-black/70">Subtotal:</span>
              <span className="tabular-nums font-black">{formatMoney(invoice.subtotalMinor, company.currency)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-black/70">GST / Tax Amount:</span>
              <span className="tabular-nums font-black">{formatMoney(invoice.taxMinor, company.currency)}</span>
            </div>
            <div className="border-t-2 border-black pt-2 flex justify-between font-black text-sm bg-yellow-100 p-1">
              <span>Invoice Total:</span>
              <span className="tabular-nums">{formatMoney(invoice.totalMinor, company.currency)}</span>
            </div>
            <div className="flex justify-between font-bold text-[#00E065]">
              <span>Amount Paid:</span>
              <span className="tabular-nums font-black">{formatMoney(invoice.paidMinor, company.currency)}</span>
            </div>
            <div className="border-t-2 border-black pt-2 flex justify-between font-black text-sm text-[#FF2A2A] bg-red-50 p-1">
              <span>Balance Owed:</span>
              <span className="tabular-nums">{formatMoney(remainingOwed, company.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="card-brutal bg-white overflow-hidden">
        <div className="bg-black text-white p-3 font-mono font-black text-xs uppercase flex items-center justify-between">
          <span>PAYMENT HISTORY & RECONCILIATION</span>
          <span className="text-[#FFE500] font-bold text-[11px]">
            {payments.length} PAYMENT(S) LOGGED
          </span>
        </div>

        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#FFE500] border-b-2 border-black text-black uppercase text-[11px]">
            <tr>
              <th className="p-3">Payment Date</th>
              <th className="p-3">Method</th>
              <th className="p-3">Account Credited</th>
              <th className="p-3">Reference</th>
              <th className="p-3 text-right">Amount Credited</th>
              <th className="p-3 text-center">Journal Entry</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-black/50 font-bold">
                  No payments recorded yet for this invoice.
                </td>
              </tr>
            ) : (
              payments.map(p => (
                <tr key={p.$id} className="hover:bg-yellow-50">
                  <td className="p-3 font-bold">
                    {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="p-3 font-black uppercase">{p.method}</td>
                  <td className="p-3 font-bold text-black/90">{p.cashAccountName || 'Bank Account'}</td>
                  <td className="p-3 text-black/70">{p.reference || '---'}</td>
                  <td className="p-3 text-right font-black tabular-nums text-[#00E065]">
                    {formatMoney(p.amountMinor, company.currency)}
                  </td>
                  <td className="p-3 text-center">
                    <Link
                      href={`/journal/${p.entryId}`}
                      className="px-2 py-1 bg-white border border-black font-bold text-[10px] hover:bg-black hover:text-white"
                    >
                      VIEW ENTRY →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Payment Drawer / Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="card-brutal bg-white w-full max-w-md p-6 space-y-4 shadow-[8px_8px_0px_#000000] font-mono">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#00E065]" />
                <h3 className="font-display font-black text-xl text-black uppercase">
                  RECORD PAYMENT
                </h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
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

            <div className="p-2.5 bg-[#FFFDF5] border-2 border-black text-xs">
              <span className="font-bold text-black/70">Remaining Balance:</span>{' '}
              <strong className="text-black font-black">
                {formatMoney(remainingOwed, company.currency)}
              </strong>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase text-black/70 mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={paymentAmountStr}
                  onChange={e => setPaymentAmountStr(e.target.value)}
                  className="w-full border-2 border-black p-2 text-xs font-bold bg-[#FFFDF5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black/70 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full border-2 border-black p-2 text-xs font-bold bg-[#FFFDF5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black/70 mb-1">
                  Deposit Into Account
                </label>
                <select
                  required
                  value={selectedCashAccountId}
                  onChange={e => setSelectedCashAccountId(e.target.value)}
                  className="w-full border-2 border-black p-2 text-xs font-bold bg-[#FFFDF5] focus:outline-none"
                >
                  {cashAccounts.map(a => (
                    <option key={a.$id} value={a.$id}>
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black/70 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full border-2 border-black p-2 text-xs font-bold bg-[#FFFDF5] focus:outline-none"
                >
                  <option value="bank">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="upi">UPI / QR Code</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="cash">Cash on Hand</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black/70 mb-1">
                  Reference / Transaction ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-987654321, UPI-12345"
                  value={paymentRef}
                  onChange={e => setPaymentRef(e.target.value)}
                  className="w-full border-2 border-black p-2 text-xs font-bold bg-[#FFFDF5] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="btn-brutal bg-white text-black px-4 py-2 text-xs"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={recording}
                  className="btn-brutal bg-[#00E065] text-black px-6 py-2 text-xs hover:bg-[#00c95a]"
                >
                  {recording ? 'COMMITTING PAYMENT...' : 'CONFIRM & POST PAYMENT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
