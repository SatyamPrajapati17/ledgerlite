'use client';

import React, { useState, useEffect } from 'react';
import { LedgerStore } from '@/lib/storage/store';
import { AuditLogItem } from '@/lib/types';
import { ShieldCheck, Lock, Activity, User, Search } from 'lucide-react';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const refresh = () => {
    setLogs(LedgerStore.getAuditLogs());
  };

  useEffect(() => {
    refresh();
    const unsub = LedgerStore.subscribe(refresh);
    return unsub;
  }, []);

  const filtered = logs.filter(
    l =>
      l.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.actorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <div>
          <span className="px-2 py-0.5 bg-[#FFE500] text-black font-black text-xs border-2 border-black">
            IMMUTABLE COMPLIANCE RECORD
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-black uppercase tracking-tight mt-1">
            FORENSIC AUDIT LOG
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-[#00E065] text-black border-2 border-black text-xs font-black flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]">
            <Lock className="w-4 h-4" />
            APPEND-ONLY PROOF
          </span>
        </div>
      </div>

      {/* Explainer card */}
      <div className="card-brutal p-4 bg-[#FFFDF5] text-xs flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-[#FF2A2A] shrink-0" />
        <p className="text-black/80">
          Every posting, voiding, invoice generation, payment settlement, and configuration change commits an immutable audit row recording actor ID, entity reference, timestamp, and action summary.
        </p>
      </div>

      {/* Search */}
      <div className="card-brutal p-3 bg-white flex items-center gap-2 text-xs">
        <Search className="w-4 h-4 text-black/50 ml-1" />
        <input
          type="text"
          placeholder="Filter audit log by actor, action, summary..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full font-bold focus:outline-none"
        />
      </div>

      {/* Audit Log Table */}
      <div className="card-brutal bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFE500] border-b-2 border-black text-black uppercase text-[11px] font-black">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Action Type</th>
                <th className="p-3">Summary</th>
                <th className="p-3">Entity ID</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-black/50 font-bold">
                    No audit records matching query.
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.$id} className="hover:bg-yellow-50 transition-colors">
                    <td className="p-3 font-semibold text-black/70 whitespace-nowrap">
                      {new Date(item.$createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td className="p-3 font-bold text-black flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-black/60 shrink-0" />
                      <span>{item.actorName}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-black text-[#FFE500] font-black text-[10px] uppercase border border-black">
                        {item.action}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-black max-w-md">
                      {item.summary}
                    </td>
                    <td className="p-3 text-[11px] text-black/60 font-mono">
                      {item.entityId}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
