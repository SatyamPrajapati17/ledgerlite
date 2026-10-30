'use client';

import React from 'react';
import { formatMoneyWithoutSymbol } from '@/lib/money';
import { CheckCircle2, AlertTriangle, Scale } from 'lucide-react';

interface DifferenceIndicatorProps {
  totalDebitMinor: number;
  totalCreditMinor: number;
  currency?: string;
}

export const DifferenceIndicator: React.FC<DifferenceIndicatorProps> = ({
  totalDebitMinor,
  totalCreditMinor,
  currency = 'INR',
}) => {
  const differenceMinor = totalDebitMinor - totalCreditMinor;
  const isBalanced = differenceMinor === 0 && totalDebitMinor > 0;
  const isZero = totalDebitMinor === 0 && totalCreditMinor === 0;

  return (
    <div className="card-brutal p-4 bg-white">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
        {/* Total Debits */}
        <div className="border-2 border-black p-3 bg-[#FFE500] shadow-[2px_2px_0px_#000000]">
          <div className="text-[10px] font-mono font-black uppercase tracking-wider text-black/70">
            TOTAL DEBITS (DR)
          </div>
          <div className="font-mono font-black text-xl text-black tabular-nums mt-0.5">
            {currency} {formatMoneyWithoutSymbol(totalDebitMinor)}
          </div>
        </div>

        {/* Total Credits */}
        <div className="border-2 border-black p-3 bg-white shadow-[2px_2px_0px_#000000]">
          <div className="text-[10px] font-mono font-black uppercase tracking-wider text-black/70">
            TOTAL CREDITS (CR)
          </div>
          <div className="font-mono font-black text-xl text-black tabular-nums mt-0.5">
            {currency} {formatMoneyWithoutSymbol(totalCreditMinor)}
          </div>
        </div>

        {/* Dynamic Balance / Difference Badge */}
        <div
          className={`border-3 border-black p-3 shadow-[3px_3px_0px_#000000] transition-all duration-200 ${
            isBalanced
              ? 'bg-[#00E065] text-black ring-2 ring-black'
              : isZero
              ? 'bg-gray-100 text-black'
              : 'bg-[#FF2A2A] text-white animate-pulse'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {isBalanced ? (
              <CheckCircle2 className="w-5 h-5 text-black shrink-0" />
            ) : isZero ? (
              <Scale className="w-5 h-5 text-black shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-white shrink-0" />
            )}
            <div className="text-[11px] font-mono font-black uppercase tracking-tight">
              {isBalanced ? 'BALANCED' : isZero ? 'ENTER AMOUNTS' : 'OUT OF BALANCE'}
            </div>
          </div>
          <div className="font-mono font-black text-xl tabular-nums mt-0.5">
            DIFF: {currency} {formatMoneyWithoutSymbol(Math.abs(differenceMinor))}
          </div>
        </div>
      </div>

      {/* Helpful explanation badge */}
      <div className="mt-3 text-xs font-mono font-semibold flex items-center justify-between border-t-2 border-black/10 pt-2 text-black/80">
        <span>
          {isBalanced
            ? '✓ Perfect zero difference! Entry is ready to commit in atomic TablesDB transaction.'
            : isZero
            ? 'Add at least two lines with account, and positive debit/credit amounts.'
            : `Debits must equal Credits to commit. Difference to resolve: ${currency} ${formatMoneyWithoutSymbol(Math.abs(differenceMinor))}`}
        </span>
        <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 bg-black text-yellow-400 border border-black">
          IMMUTABLE LEDGER RULE
        </span>
      </div>
    </div>
  );
};
