import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "AI Work OS — Mission Control",
  description: "Define the outcome. Review the evidence. Own the decision.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
