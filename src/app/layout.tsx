import "./globals.css";
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import Head from "next/head";
import Script from "next/script";

const inter = DM_Sans({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Raz",
  description: "AI iMessage Appointment Setting for Sales Teams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Head>
        <link rel="shortcut icon" href="/favicon.ico" />
      </Head>
      <body className={`dark:bg-[#1c1e20] ${inter.className}`}>{children}</body>
    </html>
  );
}
