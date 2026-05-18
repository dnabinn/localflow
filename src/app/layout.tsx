import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "LocalFlow", template: "%s | LocalFlow" },
  description: "Social media & reputation management for local businesses",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
