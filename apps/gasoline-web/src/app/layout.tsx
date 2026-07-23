import React from 'react';
import type { Metadata, Viewport } from 'next';
import { MobileLayout } from '@/components/common/MobileLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gasoline Web Operator',
  description: 'Fuel volume & retail cash tracking application',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GasolineWeb',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased overflow-hidden">
        <MobileLayout>{children}</MobileLayout>
      </body>
    </html>
  );
}
