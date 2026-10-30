import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'LedgerLite • Books That Cannot Go Out of Balance',
  description: 'Double-entry accounting SaaS built on Appwrite TablesDB with immutable history and live real-time books.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#FFFDF5] text-black">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="bg-black text-white border-t-4 border-black py-6 px-4 mt-12 font-mono text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="bg-[#FFE500] text-black px-2 py-0.5 font-black text-xs border border-black">
                LEDGERLITE
              </span>
              <span>Double-entry accounting built on Appwrite TablesDB</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-gray-300">
              <span className="text-[#00E065] font-bold">● Atomic Transactions</span>
              <span className="text-yellow-400 font-bold">● Row-Level Security</span>
              <span className="text-[#FF2A2A] font-bold">● Immutable Audit Trail</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
