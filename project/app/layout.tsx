import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MeetFlow AI — AI Meeting Productivity Agent',
  description:
    'Paste any meeting transcript and let the AI agent extract summaries, decisions, and action items in real time. Powered by Google Gemini and Swytchcode.',
  openGraph: {
    title: 'MeetFlow AI',
    description: 'AI Meeting Productivity Agent — turn transcripts into action.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <div className="scan-line-overlay" />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
