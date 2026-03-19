import type {Metadata} from 'next';
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google';
import './globals.css'; // Global styles
import { NavigationShell } from '@/components/navigation/NavigationShell';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AniStream',
  description: 'A Next-Generation AniList Web Client',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${bricolage.variable} ${dmSans.variable}`}>
      <body className="font-sans bg-[var(--surface)] text-slate-900 min-h-screen antialiased" suppressHydrationWarning>
        <NavigationShell>
          {children}
        </NavigationShell>
      </body>
    </html>
  );
}
