import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const urlPublica = process.env.NEXT_PUBLIC_SITE_URL ?? "https://guiabg.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(urlPublica),
  title: {
    default: "GuiaBG — comércios e serviços de Bento Gonçalves",
    template: "%s · GuiaBG",
  },
  description:
    "Guia comunitário de comércios e serviços de Bento Gonçalves. Encontre padarias, restaurantes, oficinas e muito mais perto de você.",
  applicationName: "GuiaBG",
  authors: [{ name: "GuiaBG" }],
  creator: "GuiaBG",
  publisher: "GuiaBG",
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    title: "GuiaBG — comércios e serviços de Bento Gonçalves",
    description:
      "Guia comunitário de comércios e serviços de Bento Gonçalves. Feito pela comunidade, para a comunidade.",
    type: "website",
    locale: "pt_BR",
    siteName: "GuiaBG",
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "GuiaBG" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GuiaBG — comércios e serviços de Bento Gonçalves",
    description: "Guia comunitário de comércios e serviços de Bento Gonçalves.",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/favicon-180.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4f4" },
    { media: "(prefers-color-scheme: dark)", color: "#120d0e" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${sourceSans.variable} ${fraunces.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          enableSystem
          storageKey="guiabg-tema"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
