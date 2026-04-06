"use client";

import { BackOfficeShell } from "@/components/backoffice/backoffice-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BackOfficeShell>{children}</BackOfficeShell>;
}
