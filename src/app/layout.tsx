import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Weekend Cric Scorer",
  description: "Fast, mobile-friendly cricket scoring for weekend matches.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
