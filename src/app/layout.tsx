import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "TypeRush Local — Race your friend",
  description:
    "A local, head-to-head typing race game inspired by Type Rush. Create a room on one Mac, join from another, and race!",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
