'use client';

import React, { useState } from 'react';
import { runIntegrityCheck, IntegrityCheckResult } from '@/lib/ledger/reports';
import { LedgerStore } from '@/lib/storage/store';
import { formatMoneyWithoutSymbol } from '@/lib/money';
import { ShieldCheck, CheckCircle2, XCircle, RefreshCw, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface IntegrityCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntegrityCheckModal: React.FC<IntegrityCheckModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntegrityCheckResult | null>(null);

  if (!isOpen) return null;

  const handleRun = () => {
    setLoading(true);
    setTimeout(() => {
      const accounts = LedgerStore.getAccounts();
      const lines = LedgerStore.getLines();
      const res = runIntegrityCheck(accounts, lines);
      setResult(res);
      setLoading(false);

      if (res.allMatch) {
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#FFE500', '#FF2A2A', '#00E065', '#000000'],
          });
        } catch {}
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="card-brutal bg-white w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-[8px_8px_0px_#000000]">
        {/* Header */}
        <div className="bg-[#FFE500] border-b-4 border-black px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-black" />
            <div>
              <h2 className="font-display font-black text-xl text-black uppercase tracking-tight">
                LEDGER INTEGRITY AUDIT
              </h2>
              <p className="text-xs font-mono font-bold text-black/70">
                RECONSTRUCTS CACHED BALANCES DIRECTLY FROM RAW JOURNAL LINES
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 border-2 border-black bg-white hover:bg-[#FF2A2A] hover:text-white transition-all shadow-[2px_2px_0px_#000000]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 font-mono">
          <div className="bg-[#FFFDF5] border-2 border-black p-4 text-xs space-y-2">
            <p className="font-bold text-black">
              HOW IT WORKS:
            </p>
            <p className="text-black/80 leading-relaxed">
              LedgerLite maintains cached balances on the <code className="bg-yellow-200 px-1 py-0.5 border border-black font-bold">accounts</code> table moved atomically with Appwrite TablesDB atomic increments. To guarantee that no corruption or drift has occurred, this verification rebuilds the true balance of every account from raw lines (<code className="bg-yellow-200 px-1 py-0.5 border border-black font-bold">debitMinor - creditMinor</code>) and asserts exact 1:1 match.
            </p>
          </div>

          {!result && !loading && (
            <div className="text-center py-8 space-y-4">
              <button
                onClick={handleRun}
                className="btn-brutal bg-[#FF2A2A] text-white px-8 py-3 text-sm flex items-center gap-2 mx-auto hover:bg-[#C71010]"
              >
                <ShieldCheck className="w-5 h-5" />
                EXECUTE REAL-TIME INTEGRITY AUDIT
              </button>
              <p className="text-xs text-black/60">
                Audits all chart of accounts against all journal records.
              </p>
            </div>
          )}

          {loading && (
            <div className="text-center py-12 space-y-3">
              <RefreshCw className="w-8 h-8 text-black animate-spin mx-auto" />
              <p className="font-bold text-sm">REBUILDING BALANCES FROM IMMUTABLE JOURNAL LINES...</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              {/* Summary Status Box */}
              <div
                className={`border-3 border-black p-4 flex items-center justify-between shadow-[4px_4px_0px_#000000] ${
                  result.allMatch ? 'bg-[#00E065] text-black' : 'bg-[#FF2A2A] text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  {result.allMatch ? (
                    <CheckCircle2 className="w-8 h-8 text-black shrink-0" />
                  ) : (
                    <XCircle className="w-8 h-8 text-white shrink-0" />
                  )}
                  <div>
                    <div className="font-black text-lg tracking-tight">
                      {result.allMatch ? '100% MATHEMATICAL INTEGRITY VERIFIED' : 'BALANCE DRIFT DETECTED'}
                    </div>
                    <div className="text-xs font-bold opacity-90">
                      {result.matchedCount} of {result.totalAccountsChecked} accounts match the rebuilt sum of journal lines.
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRun}
                  className="btn-brutal bg-white text-black px-3 py-1.5 text-xs hover:bg-yellow-300"
                >
                  RE-RUN
                </button>
              </div>

              {/* Account Breakdown Table */}
              <div className="border-2 border-black overflow-x-auto shadow-[3px_3px_0px_#000000]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-black text-white font-mono uppercase text-[11px]">
                    <tr>
                      <th className="p-2.5">Code</th>
                      <th className="p-2.5">Account Name</th>
                      <th className="p-2.5 text-right">Cached Balance</th>
                      <th className="p-2.5 text-right">Rebuilt from Lines</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black bg-white">
                    {result.items.map(it => (
                      <tr key={it.accountId} className="hover:bg-yellow-50">
                        <td className="p-2.5 font-bold">{it.code}</td>
                        <td className="p-2.5 font-semibold text-black/90">{it.name}</td>
                        <td className="p-2.5 text-right font-mono tabular-nums">
                          ₹{formatMoneyWithoutSymbol(it.cachedBalanceMinor)}
                        </td>
                        <td className="p-2.5 text-right font-mono tabular-nums">
                          ₹{formatMoneyWithoutSymbol(it.rebuiltBalanceMinor)}
                        </td>
                        <td className="p-2.5 text-center">
                          {it.matches ? (
                            <span className="px-2 py-0.5 bg-[#00E065] text-black border border-black font-black text-[10px]">
                              MATCH
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-[#FF2A2A] text-white border border-black font-black text-[10px]">
                              DIFF: ₹{formatMoneyWithoutSymbol(it.differenceMinor)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#EAEAEA] border-t-2 border-black px-6 py-3 flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold text-black/60">
            LEDGERLITE CORE ENGINE • TABLESDB TRANSACTIONAL PROOF
          </span>
          <button
            onClick={onClose}
            className="btn-brutal bg-black text-white px-4 py-1.5 text-xs hover:bg-gray-800"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
