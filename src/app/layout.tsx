import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTracker from "@/components/PageTracker";
import { SHOP_NAME, SHOP_DESCRIPTION } from "@/lib/seo";
import { getSetting } from "@/lib/data";

export const metadata: Metadata = {
  title: SHOP_NAME,
  description: SHOP_DESCRIPTION,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://repamerica.com"),
};

export const revalidate = 300;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getSetting<Record<string, string>>("theme");
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href={theme.favicon} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="gradient">
        <a className="skip-to-content-link button visually-hidden" href="#MainContent">Skip to content</a>
        <Header />
        <main id="MainContent" className="content-for-layout focus-none" role="main" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <PageTracker />
      </body>
    </html>
  );
}
