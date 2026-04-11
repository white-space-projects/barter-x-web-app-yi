"use client";

/**
 * ============================================================================
 * BACKOFFICE VERIFICATION PAGE
 * ============================================================================
 * Handles magic link verification for invited backoffice users.
 */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, Home } from "lucide-react";

export default function BackOfficeVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. No token provided.");
        return;
      }

      try {
        const response = await fetch("/api/backoffice/users/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus("success");
          setEmail(data.user?.email || "");
          setMessage("Your account has been verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed. The link may be expired or invalid.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred during verification. Please try again.");
      }
    }

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            BARTER-X
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Back Office Portal
          </p>
        </div>

        {/* Status Card */}
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Verifying your account...
              </h2>
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your invitation.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Account Verified!
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {message}
                {email && (
                  <>
                    <br />
                    <span className="font-medium text-foreground">{email}</span>
                  </>
                )}
              </p>
              <Link
                href="/backoffice/login"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Continue to Login
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Verification Failed
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {message}
              </p>
              <Link
                href="/backoffice/login"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-secondary px-6 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
              >
                Go to Login
              </Link>
            </>
          )}
        </div>

        {/* Back to App Link */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <Home className="h-4 w-4" />
          Back to App
        </Link>
      </div>
    </div>
  );
}
