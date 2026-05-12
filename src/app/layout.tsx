import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maps Pulse Saigon",
  description: "A neon atlas dashboard for Ho Chi Minh City Google Maps recents."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
