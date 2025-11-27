import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Echorcel",
  description: "Deploy your applications to Docker with ease",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-dvh flex flex-col bg-zinc-50 text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}
