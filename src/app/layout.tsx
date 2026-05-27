import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Go Saigon | Ho Chi Minh City Destination Explorer",
  description: "Explore highly reviewed food, nightlife, landmarks, shopping, fitness, education, and visitor services across Ho Chi Minh City."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
