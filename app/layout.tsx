import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { Header } from '@/components/header';

export const metadata: Metadata = {
  title: 'HypeHaus - Find the night. Own the moment.',
  description: 'Discover and book the best events, concerts, and experiences in your city.',
  keywords: ['events', 'concerts', 'nightlife', 'tickets', 'entertainment'],
  openGraph: {
    title: 'HypeHaus - Find the night. Own the moment.',
    description: 'Discover and book the best events, concerts, and experiences in your city.',
    type: 'website',
  },
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <Header />
          <main className="min-h-screen pt-16">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
