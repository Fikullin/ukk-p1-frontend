import type { Metadata } from "next";
import "./globals.css";
import AuthWrapper from "../components/AuthWrapper";

export const metadata: Metadata = {
  title: "Sistem Peminjaman Alat",
  description: "Aplikasi web untuk peminjaman alat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthWrapper>
          <main>{children}</main>
        </AuthWrapper>
      </body>
    </html>
  );
}
