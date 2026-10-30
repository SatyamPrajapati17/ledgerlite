'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, UserCheck, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'owner' | 'accountant' | 'viewer'>('owner');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/');
  };

  const handleQuickDemoLogin = (selectedRole: 'owner' | 'accountant' | 'viewer') => {
    setRole(selectedRole);
    router.push('/');
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-6 font-mono">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-block bg-[#FF2A2A] text-white px-3 py-1 border-3 border-black shadow-[3px_3px_0px_#000000] font-black text-2xl">
          LEDGERLITE
        </div>
        <h1 className="font-display font-black text-3xl uppercase tracking-tight text-black">
          {isSignUp ? 'CREATE YOUR WORKSPACE' : 'ENTER COMPANY BOOKS'}
        </h1>
        <p className="text-xs text-black/70">
          Books that cannot go out of balance. Backed by Appwrite TablesDB.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="card-brutal p-6 bg-white space-y-5 shadow-[6px_6px_0px_#000000]">
        <div className="flex border-2 border-black font-bold text-xs">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-2 text-center transition-all ${
              !isSignUp ? 'bg-black text-[#FFE500]' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-2 text-center transition-all border-l-2 border-black ${
              isSignUp ? 'bg-black text-[#FFE500]' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            SIGN UP
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-black uppercase text-black/70 mb-1">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-black/50" />
              <input
                type="email"
                required
                placeholder="founder@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border-2 border-black font-bold bg-[#FFFDF5] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-black uppercase text-black/70 mb-1">
              PASSWORD
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-black/50" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border-2 border-black font-bold bg-[#FFFDF5] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-brutal bg-[#FFE500] text-black w-full py-3 font-black text-sm flex items-center justify-center gap-2 hover:bg-yellow-300"
          >
            <span>{isSignUp ? 'REGISTER & SETUP COMPANY' : 'SIGN IN TO LEDGER'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo 1-Click Logins */}
        <div className="border-t-2 border-black pt-4 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-black/70">
            <Sparkles className="w-3.5 h-3.5 text-[#FF2A2A]" />
            <span>ONE-CLICK INSTANT DEMO ROLES</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickDemoLogin('owner')}
              className="btn-brutal bg-[#FF2A2A] text-white p-2 text-[10px] text-center hover:bg-[#C71010]"
            >
              OWNER (ADMIN)
            </button>
            <button
              onClick={() => handleQuickDemoLogin('accountant')}
              className="btn-brutal bg-white text-black p-2 text-[10px] text-center hover:bg-yellow-200"
            >
              ACCOUNTANT
            </button>
            <button
              onClick={() => handleQuickDemoLogin('viewer')}
              className="btn-brutal bg-[#00E065] text-black p-2 text-[10px] text-center hover:bg-[#00c95a]"
            >
              AUDITOR (VIEW)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
