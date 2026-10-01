import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gnani AI · Audio Intelligence",
  description: "Turn audio into clear, useful intelligence with Gnani AI."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
