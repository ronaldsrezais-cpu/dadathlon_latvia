import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dadathlon Latvija — reģistrācija",
  description: "Reģistrācija tēviem un bērniem Dadathlon pasākumam Pasta salā, Jelgavā.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="lv">
      <body>{children}</body>
    </html>
  );
}
