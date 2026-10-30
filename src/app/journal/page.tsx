'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LedgerStore } from '@/lib/storage/store';
import { JournalEntry } from '@/lib/types';
import { formatMoney } from '@/lib/money';
import { PlusCircle, Search, Filter, BookOpen, ArrowRight } from 'lucide-react';

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [company, setCompany] = useState(LedgerStore.getCompany());
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  const refresh = () => {
    setEntries(LedgerStore.getEntries());
    setCompany(LedgerStore.getCompany());
  };

  useEffect(() => {
    refresh();
    const unsub = LedgerStore.subscribe(refresh);
    return unsub;
  }, []);

  const filtered = entries.filter(e => {
    const matchesSearch =
      e.memo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(e.entryNo).includes(searchTerm) ||
      e.source.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSource = sourceFilter === 'all' || e.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <div>
          <span className="px-2 py-0.5 bg-[#FFE500] text-black font-black text-xs border-2 border-black font-mono">
            GENERAL JOURNAL
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-black uppercase tracking-tight mt-1">
            IMMUTABLE JOURNAL ENTRIES
          </h1>
        </div>

        <Link
          href="/journal/new"
          className="btn-brutal bg-[#FF2A2A] text-white px-5 py-2.5 text-xs flex items-center gap-2 hover:bg-[#C71010]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>NEW JOURNAL ENTRY</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-brutal p-3 bg-white flex flex-col sm:flex-row items-center gap-3 font-mono text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-black/50" />
          <input
            type="text"
            placeholder="Search by entry #, memo, description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border-2 border-black font-bold focus:outline-none focus:bg-yellow-50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-black shrink-0" />
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="border-2 border-black px-3 py-2 font-bold bg-white focus:outline-none"
          >
            <option value="all">All Sources</option>
            <option value="manual">Manual</option>
            <option value="invoice">Invoice</option>
            <option value="payment">Payment</option>
            <option value="reversal">Reversal (Void)</option>
            <option value="seed">Initial Seed</option>
          </select>
        </div>
      </div>

      {/* Entries Table */}
      <div className="card-brutal bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#FFE500] border-b-2 border-black text-black uppercase text-[11px]">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Accounting Date</th>
                <th className="p-3">Memo</th>
                <th className="p-3">Source</th>
                <th className="p-3 text-right">Debit / Credit Sum</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Lines</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-black/50 font-bold">
                    No journal entries found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(entry => {
                  const isVoided = !!entry.reversalOfId;
                  const isReversal = entry.source === 'reversal';

                  return (
                    <tr key={entry.$id} className="hover:bg-yellow-50 transition-colors">
                      <td className="p-3 font-black text-sm">#{entry.entryNo}</td>
                      <td className="p-3 font-semibold text-black/80">
                        {new Date(entry.entryDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="p-3 font-bold text-black max-w-sm truncate">
                        {entry.memo}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-gray-100 border border-black text-[10px] uppercase font-bold">
                          {entry.source}
                        </span>
                      </td>
                      <td className="p-3 text-right font-black tabular-nums text-sm">
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
                          className="btn-brutal bg-white text-black px-2.5 py-1 text-[11px] inline-flex items-center gap-1 hover:bg-black hover:text-white"
                        >
                          <span>DETAILS</span>
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
