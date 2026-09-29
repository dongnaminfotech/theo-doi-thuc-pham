import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'New Green — Thực đơn & Truy xuất Nguồn gốc Bữa ăn Học đường',
  description: 'Hệ thống Quản lý Thực đơn & Truy xuất Nguồn gốc Bữa ăn Học đường New Green',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col bg-[#f7f8f3] text-[#173b30] antialiased">
        {children}
      </body>
    </html>
  );
}
