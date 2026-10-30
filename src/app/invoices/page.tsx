'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LedgerStore } from '@/lib/storage/store';
import { Invoice } from '@/lib/types';
import { formatMoney } from '@/lib/money';
import { PlusCircle, Search, Filter, ArrowRight, Receipt, CreditCard } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [company, setCompany] = useState(LedgerStore.getCompany());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const refresh = () => {
    setInvoices(LedgerStore.getInvoices());
    setCompany(LedgerStore.getCompany());
  };

  useEffect(() => {
    refresh();
    const unsub = LedgerStore.subscribe(refresh);
    return unsub;
  }, []);

  const filtered = invoices.filter(inv => {
    const matchesSearch =
      inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.contactName && inv.contactName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOwed = invoices
    .filter(i => i.status !== 'void' && i.status !== 'paid')
    .reduce((sum, i) => sum + (i.totalMinor - i.paidMinor), 0);

  const totalCollected = invoices.reduce((sum, i) => sum + i.paidMinor, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <div>
          <span className="px-2 py-0.5 bg-[#FFE500] text-black font-black text-xs border-2 border-black font-mono">
            SALES & RECEIVABLES
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-black uppercase tracking-tight mt-1">
            SALES INVOICES
          </h1>
        </div>

        <Link
          href="/invoices/new"
          className="btn-brutal bg-[#FFE500] text-black px-5 py-2.5 text-xs flex items-center gap-2 hover:bg-yellow-300"
        >
          <PlusCircle className="w-4 h-4" />
          <span>CREATE & POST INVOICE</span>
        </Link>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="card-brutal p-4 bg-white">
          <span className="text-[10px] font-black uppercase text-black/60">OUTSTANDING RECEIVABLES</span>
          <div className="text-2xl font-black text-[#FF2A2A] tabular-nums mt-1">
            {formatMoney(totalOwed, company.currency)}
          </div>
          <span className="text-[11px] text-black/70">Awaiting customer clearance</span>
        </div>

        <div className="card-brutal p-4 bg-[#FFE500]">
          <span className="text-[10px] font-black uppercase text-black">TOTAL COLLECTED CASH</span>
          <div className="text-2xl font-black text-black tabular-nums mt-1">
            {formatMoney(totalCollected, company.currency)}
          </div>
          <span className="text-[11px] text-black/80 font-bold">Successfully received into bank</span>
        </div>

        <div className="card-brutal p-4 bg-white">
          <span className="text-[10px] font-black uppercase text-black/60">INVOICE COUNT</span>
          <div className="text-2xl font-black text-black tabular-nums mt-1">
            {invoices.length} INVOICES
          </div>
          <span className="text-[11px] text-black/70">
            {invoices.filter(i => i.status === 'paid').length} fully settled
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="card-brutal p-3 bg-white flex flex-col sm:flex-row items-center gap-3 font-mono text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-black/50" />
          <input
            type="text"
            placeholder="Search by invoice # or customer name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border-2 border-black font-bold focus:outline-none focus:bg-yellow-50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-black shrink-0" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border-2 border-black px-3 py-2 font-bold bg-white focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="sent">Sent / Unpaid</option>
            <option value="partial">Partially Paid</option>
            <option value="paid">Fully Paid</option>
            <option value="void">Void</option>
          </select>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="card-brutal bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#FFE500] border-b-2 border-black text-black uppercase text-[11px]">
              <tr>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Issue Date</th>
                <th className="p-3">Due Date</th>
                <th className="p-3 text-right">Total (Inc. GST)</th>
                <th className="p-3 text-right">Paid</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-black/50 font-bold">
                    No invoices found. Click "Create & Post Invoice" to bill a client.
                  </td>
                </tr>
              ) : (
                filtered.map(inv => {
                  const remaining = inv.totalMinor - inv.paidMinor;
                  return (
                    <tr key={inv.$id} className="hover:bg-yellow-50 transition-colors">
                      <td className="p-3 font-black text-sm">{inv.number}</td>
                      <td className="p-3 font-bold text-black">{inv.contactName || '---'}</td>
                      <td className="p-3 text-black/80">
                        {new Date(inv.issueDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="p-3 text-black/80">
                        {new Date(inv.dueDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="p-3 text-right font-black tabular-nums">
                        {formatMoney(inv.totalMinor, company.currency)}
                      </td>
                      <td className="p-3 text-right font-bold tabular-nums text-black/80">
                        {formatMoney(inv.paidMinor, company.currency)}
                      </td>
                      <td className="p-3 text-center">
                        {inv.status === 'paid' ? (
                          <span className="px-2 py-0.5 bg-[#00E065] text-black border border-black font-black text-[10px]">
                            PAID
                          </span>
                        ) : inv.status === 'partial' ? (
                          <span className="px-2 py-0.5 bg-[#FFE500] text-black border border-black font-black text-[10px]">
                            PARTIAL
                          </span>
                        ) : inv.status === 'void' ? (
                          <span className="px-2 py-0.5 bg-[#FF2A2A] text-white border border-black font-black text-[10px]">
                            VOID
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-black text-white border border-black font-black text-[10px]">
                            SENT
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <Link
                          href={`/invoices/${inv.$id}`}
                          className="btn-brutal bg-white text-black px-2.5 py-1 text-[11px] inline-flex items-center gap-1 hover:bg-black hover:text-white"
                        >
                          <span>{inv.status === 'paid' ? 'VIEW' : 'PAY / VIEW'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
