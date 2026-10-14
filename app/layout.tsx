import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rotaract RecruitX | Recruitment & Interview Management',
  description: 'Enterprise recruitment management platform for Rotaract Club of TIT & S',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-[#0b1120] text-slate-100 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
