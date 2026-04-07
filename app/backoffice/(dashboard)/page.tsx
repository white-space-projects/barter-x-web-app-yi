"use client";

/**
 * Backoffice root page - redirects to Field Schema
 * All other backoffice modules have been removed for cleanup.
 * Field Schema is the only preserved module.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BackOfficeDashboardPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/backoffice/field-schema");
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-muted-foreground">Redirecting to Field Schema...</div>
    </div>
  );
}
