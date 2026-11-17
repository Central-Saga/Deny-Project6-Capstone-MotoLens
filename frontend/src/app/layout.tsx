import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { CompareProvider } from '@/hooks/useCompare';
import { AppShell } from '@/components/shared/AppShell';

export const metadata: Metadata = {
  title: 'MotoLens — AI Used Motorcycle Marketplace & Inspection Bali',
  description:
    'Platform jual beli motor bekas di Bali dengan sertifikat inspeksi kerusakan bodi berbasis YOLOv8 ONNX dan Explainable Price Breakdown.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        <AuthProvider>
          <CompareProvider>
            <AppShell>{children}</AppShell>
          </CompareProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
