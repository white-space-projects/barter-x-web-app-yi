"use client";

/**
 * ============================================================================
 * BACK OFFICE LOGIN PAGE
 * ============================================================================
 * Email + OTP login for Back Office access.
 * OTP is hardcoded to 123456 for temporary auth.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, AlertCircle, ArrowRight, Home } from "lucide-react";
import Link from "next/link";
import { loginWithOtp } from "@/lib/backoffice/api";
import { useBackOfficeAuth } from "@/lib/backoffice/auth-store";

export default function BackOfficeLoginPage() {
  const router = useRouter();
  const { login } = useBackOfficeAuth();

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    // For now, just move to OTP step
    // In production, this would send an OTP email
    setStep("otp");
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginWithOtp(email, otp);

      if (result.success && result.user) {
        login(result.user);
        router.push("/backoffice");
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

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

        {/* Login Card */}
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground text-center mb-6">
            {step === "email" ? "Sign in to Back Office" : "Enter OTP Code"}
          </h2>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@project-x.com"
                    className="h-11 w-full rounded-lg border border-input bg-secondary pl-10 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring md:text-sm"
                    required
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Only authorized emails can access Back Office
                </p>
              </div>

              <button
                type="submit"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="text-center text-sm text-muted-foreground mb-4">
                <p>
                  Enter the 6-digit code sent to{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError("");
                  }}
                  className="text-primary hover:underline mt-1"
                >
                  Use a different email
                </button>
              </div>

              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  OTP Code
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="h-11 w-full rounded-lg border border-input bg-secondary pl-10 pr-4 text-base text-foreground tracking-widest text-center font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring md:text-sm"
                    required
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground text-center">
                  Hint: Use code <span className="font-mono text-primary">123456</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

{/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Internal use only. Unauthorized access is prohibited.
        </p>

        {/* Back to App Link */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <Home className="h-4 w-4" />
          Back to App
        </Link>
      </div>
    </div>
  );
}
