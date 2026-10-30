'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, PlusCircle, FileText, BarChart3, ShieldCheck, Settings, Users, Radio, Database } from 'lucide-react';
import { isAppwriteConfigured } from '@/lib/appwrite/config';
import { LedgerStore } from '@/lib/storage/store';

export const Navbar = () => {
  const pathname = usePathname();
  const [hasAppwrite, setHasAppwrite] = useState(false);
  const [pingSuccess, setPingSuccess] = useState<boolean | null>(null);
  const [company, setCompany] = useState(LedgerStore.getCompany());
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setHasAppwrite(isAppwriteConfigured());
    if (typeof window !== 'undefined') {
      import('@/lib/appwrite/config').then(({ client }) => {
        client.ping().then(
          () => setPingSuccess(true),
          () => setPingSuccess(false)
        );
      });
    }
    const unsub = LedgerStore.subscribe(() => {
      setCompany(LedgerStore.getCompany());
      setPulse(true);
      setTimeout(() => setPulse(false), 800);
    });
    return unsub;
  }, []);

  const navLinks = [
    { href: '/', label: 'DASHBOARD', icon: BarChart3 },
    { href: '/invoices', label: 'INVOICES', icon: FileText },
    { href: '/journal', label: 'JOURNAL', icon: BookOpen },
    { href: '/accounts', label: 'ACCOUNTS', icon: Users },
    { href: '/reports', label: 'REPORTS', icon: BarChart3 },
    { href: '/audit', label: 'AUDIT LOG', icon: ShieldCheck },
    { href: '/settings', label: 'SETTINGS', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FFE500] border-b-4 border-black">
      {/* Top Ticker / Status Bar */}
      <div className="bg-black text-white px-4 py-1.5 flex items-center justify-between text-xs font-mono tracking-wider overflow-x-auto">
        <div className="flex items-center gap-4 shrink-0">
          <span className="flex items-center gap-1.5 text-[#00E065] font-bold">
            <span className={`w-2.5 h-2.5 rounded-full bg-[#00E065] inline-block ${pulse ? 'scale-150 animate-ping' : 'animate-pulse'}`} />
            LIVE BOOKS: SYNCHRONIZED
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-yellow-400 font-bold uppercase">{company.name} ({company.currency})</span>
          <span className="text-gray-400">|</span>
          <span>IMMUTABLE DOUBLE-ENTRY ENGINE</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/settings"
            className={`px-2 py-0.5 border text-[11px] font-bold flex items-center gap-1 transition-all ${
              pingSuccess
                ? 'bg-[#00E065] text-black border-black hover:bg-white'
                : hasAppwrite
                ? 'bg-[#FFE500] text-black border-black hover:bg-white'
                : 'bg-[#FF2A2A] text-white border-white hover:bg-white hover:text-black'
            }`}
          >
            <Database className="w-3 h-3" />
            {pingSuccess
              ? 'APPWRITE CONNECTED (PONG!)'
              : hasAppwrite
              ? 'APPWRITE CONFIGURED'
              : 'LOCAL ENGINE'}
          </Link>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-[#FF2A2A] text-white px-2.5 py-1 border-3 border-black shadow-[3px_3px_0px_#000000] font-black font-mono text-xl group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-[1px_1px_0px_#000000] transition-all">
            LL
          </div>
          <div className="leading-tight">
            <div className="font-display font-black text-2xl tracking-tighter text-black flex items-center gap-1">
              LEDGER<span className="text-[#FF2A2A]">LITE</span>
            </div>
            <div className="text-[10px] font-mono font-bold tracking-widest text-black/70">
              TABLES_DB RELATIONAL ENGINE
            </div>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1">
          {navLinks.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-xs font-bold tracking-wider font-mono border-2 border-black transition-all ${
                  isActive
                    ? 'bg-black text-[#FFE500] shadow-[3px_3px_0px_#FF2A2A] translate-x-0.5 translate-y-0.5'
                    : 'bg-white text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_#000000]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/invoices/new"
            className="btn-brutal bg-white text-black px-3.5 py-1.5 text-xs flex items-center gap-1.5 hover:bg-[#FFE500]"
          >
            <PlusCircle className="w-4 h-4 text-black" />
            <span>INVOICE</span>
          </Link>

          <Link
            href="/journal/new"
            className="btn-brutal bg-[#FF2A2A] text-white px-3.5 py-1.5 text-xs flex items-center gap-1.5 hover:bg-[#C71010]"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>NEW ENTRY</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
