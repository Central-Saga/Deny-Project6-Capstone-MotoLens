import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { CompareProvider } from '@/hooks/useCompare';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { MobileBottomNav } from '@/components/shared/MobileBottomNav';
import { FloatingCompareBar } from '@/components/shared/FloatingCompareBar';

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
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <AuthProvider>
          <CompareProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <FloatingCompareBar />
            <Footer />
            <MobileBottomNav />
          </CompareProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
