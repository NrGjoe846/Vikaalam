import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export const metadata: Metadata = {
  title: 'VIKALAAM — Agentic Used-Bike Acquisition Operating System',
  description: 'AI-Powered Used-Bike Acquisition, Sales, Valuation & Employee Operations CRM',
};

export default function RootLayout({
  children,
}: ReadchildProps<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 flex overflow-x-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <Header />
          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}

interface ReadchildProps<T> {
  children: React.ReactNode;
}
