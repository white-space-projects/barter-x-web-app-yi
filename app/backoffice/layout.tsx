import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Back Office | BARTER-X",
  description: "BARTER-X Back Office - Admin Operations Portal",
};

export default function BackOfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
