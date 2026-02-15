import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bonfire Visualizer",
  description: "Knowledge graph visualization for Bonfires",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased font-sans bg-background text-foreground min-h-screen">
        {children}
      </body>
    </html>
  );
}
