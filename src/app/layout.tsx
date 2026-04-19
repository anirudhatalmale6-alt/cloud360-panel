import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cloud360 Admin Panel",
  description: "Infrastructure Management Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
