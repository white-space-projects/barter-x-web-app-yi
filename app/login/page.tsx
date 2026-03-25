"use client";

import React from "react";
import { GlobalNav } from "@/components/global-nav";
import { useBarterStore } from "@/lib/store";
import { generateGuid } from "@/lib/guid";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, MapPin, ChevronDown } from "lucide-react";
import { detectLocationFromIP, isAppleDevice, type GeoLocation } from "@/lib/geolocation";
import { getCountryNames, getCitiesForCountry, getCountryCode, isCountrySupported } from "@/lib/countries-data";
import { SupportAPI, type LoginIssueReport } from "@/lib/api";
import { GoogleLogin } from "@react-oauth/google";

type LoginStep = "credentials" | "otp";

const ADMIN_EMAIL = "admin@barter-x.com";
const ADMIN_OTP = "123456";

export default function LoginPage() {
  const { auth, authReady, login } = useBarterStore();
  const router = useRouter();
  const adminEmails = JSON.parse(process.env.NEXT_PUBLIC_ADMIN_EMAILS || "[]");
  const [step, setStep] = useState<LoginStep>("credentials");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Login trouble reporting state
  const [hasLoginError, setHasLoginError] = useState(false);
  const [lastError, setLastError] = useState<{ type: string; message: string } | null>(null);
  const [showTroubleForm, setShowTroubleForm] = useState(false);
  const [troubleMessage, setTroubleMessage] = useState("");
  const [reportingIssue, setReportingIssue] = useState(false);
  
  // Location state (auto-detected from IP)
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationDetected, setLocationDetected] = useState(false);
  const [locationNotSupported, setLocationNotSupported] = useState(false);
  
  // Available options for dropdowns
  const countries = getCountryNames();
  const cities = country ? getCitiesForCountry(country) : [];
  
  // Apple device detection
  const [showAppleSignIn, setShowAppleSignIn] = useState(false);

  // Redirect if already logged in (after auth is ready)
  useEffect(() => {
    if (authReady && auth.isAuthenticated) {
      router.replace("/workspace");
    }
  }, [authReady, auth.isAuthenticated, router]);

  // Detect if Apple device (for Apple Sign-In button)
  useEffect(() => {
    setShowAppleSignIn(isAppleDevice());
  }, []);

  // Auto-detect location from IP
  useEffect(() => {
    async function detectLocation() {
      setLocationLoading(true);
      const location = await detectLocationFromIP();
      if (location) {
        // Check if detected country is in our supported list
        if (location.isSupported && isCountrySupported(location.country)) {
          setCountry(location.country);
          setCountryCode(location.countryCode);
          // Check if detected city is in the country's city list
          const availableCities = getCitiesForCountry(location.country);
          if (availableCities.includes(location.city)) {
            setCity(location.city);
          } else if (availableCities.length > 0) {
            // City not in list, user will need to select manually
            setCity("");
          }
          setLocationDetected(true);
        } else {
          // Country not supported - user needs to select manually
          setLocationNotSupported(true);
          setLocationDetected(false);
        }
      }
      setLocationLoading(false);
    }
    detectLocation();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [countdown]);

  const validateCredentials = useCallback((): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Please enter a valid email.";
    }
    if (!city.trim()) {
      errs.city = "City is required for regional matching.";
    }
    if (!country.trim()) {
      errs.country = "Country is required for regional matching.";
    }
    return errs;
  }, [email, city, country]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateCredentials();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    
    try {
      // MOCK OTP SEND - Bypassing real API
      await new Promise((r) => setTimeout(r, 500)); // Simulate network delay
      
      setLoading(false);
      setStep("otp");
      setCountdown(60);
      toast.success("OTP sent to your email. (Use any 6-digit code)");
    } catch (error) {
      setLoading(false);
      setHasLoginError(true);
      setLastError({ type: "otp_send", message: error instanceof Error ? error.message : "Failed to send OTP" });
      toast.error("Failed to send OTP. Please try again.");
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      errs.otp = "Enter a valid 6-digit OTP.";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    
    try {
      // MOCK OTP VERIFY - Accept any 6-digit OTP
      await new Promise((r) => setTimeout(r, 500)); // Simulate network delay
      
      // Admin shortcut: admin@barter-x.com
      const isAdmin = adminEmails.includes(email.toLowerCase());

      const user = {
          userId: generateGuid(),
          name: name.trim() || "Barter User",
          email: email.toLowerCase(),
          isAdmin,
          city: city.trim() || "Berlin",
          country: country.trim() || "Germany",
          countryCode: countryCode || "DE",
      };
      const token = generateGuid();

      login(user, token);
      setLoading(false);
      toast.success("Logged in successfully.");
      
      // Navigate to workspace - profile will be shown inline if needed
      router.push("/workspace");
    } catch (error) {
      setLoading(false);
      setHasLoginError(true);
      setLastError({ type: "otp_verify", message: error instanceof Error ? error.message : "OTP verification failed" });
      toast.error("OTP verification failed. Please try again.");
    }
  }

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setGoogleLoading(true);
        
        try {
          // MOCK GOOGLE LOGIN - Bypassing real API
          await new Promise((r) => setTimeout(r, 800)); // Simulate network delay
          
          const mockGoogleUser = {
            userId: generateGuid(),
            name: "Google User",
            email: "google.user@gmail.com",
            isAdmin: false,
            city: city.trim() || "Berlin",
            country: country.trim() || "Germany",
            countryCode: countryCode || "DE",
          };
          const token = generateGuid();

          login(mockGoogleUser, token);
          setGoogleLoading(false);
          toast.success("Signed in with Google.");
          
          // Navigate to workspace
          router.push("/workspace");
        } catch (error) {
          setGoogleLoading(false);
          toast.error("Google sign-in failed. Please try again.");
        }
  }


  async function handleAppleSignIn() {
    // Validate location before proceeding
    if (!city.trim() || !country.trim()) {
      setErrors({
        city: !city.trim() ? "City is required." : "",
        country: !country.trim() ? "Country is required." : "",
      });
      toast.error("Please confirm your location first.");
      setHasLoginError(true);
      setLastError({ type: "apple_auth", message: "Location not provided" });
      return;
    }
    
    setAppleLoading(true);
    
    try {
      /**
       * APPLE AUTH API PLACEHOLDER
       * ==========================
       * Implement Apple Sign-In using Sign in with Apple JS.
       * On success, call backend to verify and create session.
       * On failure, set hasLoginError and lastError for trouble reporting.
       */
      await new Promise((r) => setTimeout(r, 1200));
      
      // Mock Apple sign-in
      const mockAppleUser = {
        userId: generateGuid(),
        name: "Apple User",
        email: "user@icloud.com",
        isAdmin: false,
        city: city.trim(),
        country: country.trim(),
        countryCode: countryCode || undefined,
      };
      const token = generateGuid();
      
      login(mockAppleUser, token);
      setAppleLoading(false);
      toast.success("Signed in with Apple.");
      // New user needs to complete profile
      router.push("/workspace");
    } catch (error) {
      setAppleLoading(false);
      setHasLoginError(true);
      setLastError({ type: "apple_auth", message: error instanceof Error ? error.message : "Apple sign-in failed" });
      toast.error("Apple sign-in failed. Please try again.");
    }
  }

  function handleResendOtp() {
    if (countdown > 0) return;
    setCountdown(60);
    toast.success("OTP resent.");
  }

  async function handleReportLoginIssue() {
    if (!troubleMessage.trim()) {
      toast.error("Please describe the issue you're experiencing.");
      return;
    }

    setReportingIssue(true);

    try {
      const report: LoginIssueReport = {
        email: email || "unknown",
        errorType: (lastError?.type as LoginIssueReport["errorType"]) || "other",
        errorMessage: lastError?.message || "User reported issue without specific error",
        userMessage: troubleMessage.trim(),
        timestamp: new Date().toISOString(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
        },
      };

      /**
       * JIRA INTEGRATION PLACEHOLDER
       * ============================
       * This calls SupportAPI.reportLoginIssue() which should:
       * 1. Create a Jira ticket with the issue details
       * 2. Jira project/space needs to be configured
       * 3. Ticket fields: Summary, Description, Priority, Labels
       * 
       * For now, this logs to console and returns a mock ticket ID.
       * Backend developer: Implement actual Jira API integration.
       */
      const result = await SupportAPI.reportLoginIssue(report);

      toast.success("Issue reported. We'll look into it shortly.");
      setShowTroubleForm(false);
      setTroubleMessage("");
      setHasLoginError(false);
      setLastError(null);
    } catch (error) {
      toast.error("Failed to report issue. Please try again.");
    } finally {
      setReportingIssue(false);
    }
  }

  // Show loading while auth is hydrating or if already authenticated
  if (!authReady || auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalNav />
        <main className="flex items-center justify-center px-4 py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalNav />
      <main className="flex items-center justify-center px-4 py-16 lg:py-24">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-border bg-card p-8">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-primary">BARTER-X</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Exchange used products without buying or selling.
              </p>
            </div>

            {step === "credentials" ? (
              <div>
                {/* Google Sign-in Button */}
                <button
                  type="button"
                  onClick={() => {
                  (document
                      .querySelector("#googleLoginButton div[role='button']") as HTMLElement)
                      ?.click();
                  }}
                  disabled={googleLoading}
                  className="mb-6 flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-border bg-secondary text-sm font-medium text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-60"
                >
                  {googleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>

                {/* Hidden Google Button */}
                <div className="hidden" id="googleLoginButton">
                  <GoogleLogin                    
                    onSuccess={handleGoogleSuccess}
                    onError={() => toast.error("Login Failed")}
                  />
                </div>

                {/* Apple Sign-In - Only visible on Apple devices */}
                {showAppleSignIn && (
                  <button
                    type="button"
                    onClick={handleAppleSignIn}
                    disabled={appleLoading}
                    className="mb-4 flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-border bg-black text-sm font-medium text-white transition-colors hover:bg-black/90 disabled:opacity-60"
                  >
                    {appleLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                        Continue with Apple
                      </>
                    )}
                  </button>
                )}

                {/* Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">
                      or continue with email
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSendOtp}>
                  {/* Email */}
                  <div className="mb-4">
                    <label
                      htmlFor="login-email"
                      className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                      Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email)
                          setErrors((p) => ({ ...p, email: "" }));
                      }}
                      placeholder="you@example.com"
                      className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-destructive">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Name */}
                  <div className="mb-6">
                    <label
                      htmlFor="login-name"
                      className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                      Name{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <input
                      id="login-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Location Section */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Your Location</span>
                      {locationLoading && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                      {locationDetected && !locationLoading && (
                        <span className="text-xs text-muted-foreground">(auto-detected)</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      We use your location to show products and offers from your region.
                    </p>
                    
                    {/* Country dropdown first (city depends on country) */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Country */}
                      <div>
                        <label
                          htmlFor="login-country"
                          className="mb-1.5 block text-sm font-medium text-foreground"
                        >
                          Country <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <select
                            id="login-country"
                            value={country}
                            onChange={(e) => {
                              const selectedCountry = e.target.value;
                              setCountry(selectedCountry);
                              setCity(""); // Reset city when country changes
                              setCountryCode(getCountryCode(selectedCountry) || "");
                              if (errors.country) setErrors((p) => ({ ...p, country: "" }));
                            }}
                            disabled={locationLoading}
                            className="h-11 w-full appearance-none rounded-lg border border-input bg-secondary pl-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                          >
                            <option value="">
                              {locationLoading ? "Detecting..." : "Select country"}
                            </option>
                            {countries.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                        {errors.country && (
                          <p className="mt-1 text-xs text-destructive">{errors.country}</p>
                        )}
                      </div>
                      
                      {/* City */}
                      <div>
                        <label
                          htmlFor="login-city"
                          className="mb-1.5 block text-sm font-medium text-foreground"
                        >
                          City <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <select
                            id="login-city"
                            value={city}
                            onChange={(e) => {
                              setCity(e.target.value);
                              if (errors.city) setErrors((p) => ({ ...p, city: "" }));
                            }}
                            disabled={locationLoading || !country}
                            className="h-11 w-full appearance-none rounded-lg border border-input bg-secondary pl-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                          >
                            <option value="">
                              {!country ? "Select country first" : locationLoading ? "Detecting..." : "Select city"}
                            </option>
                            {cities.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                        {errors.city && (
                          <p className="mt-1 text-xs text-destructive">{errors.city}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Warning if location not supported */}
                    {locationNotSupported && (
                      <p className="mt-2 text-xs text-amber-500">
                        Your detected location is not in our supported regions. Please select from the available countries.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || locationLoading}
                    className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Send OTP"
                    )}
                  </button>

                  
                </form>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <p className="mb-4 text-sm text-muted-foreground text-center">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>

                {/* OTP Input */}
                <div className="mb-4">
                  <label
                    htmlFor="login-otp"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    One-time code
                  </label>
                  <input
                    id="login-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtp(val);
                      if (errors.otp) setErrors((p) => ({ ...p, otp: "" }));
                    }}
                    placeholder="000000"
                    className="h-12 w-full rounded-lg border border-input bg-secondary px-3 text-center font-mono text-xl tracking-[0.4em] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                  />
                  {errors.otp && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.otp}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verify OTP"
                  )}
                </button>

                {/* Countdown / Resend */}
                <div className="mt-4 text-center">
                  {countdown > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Resend available in{" "}
                      <span className="font-mono text-foreground">
                        {countdown}s
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                {/* Having Trouble Login? - shows after failed attempt or when OTP not received */}
                {(hasLoginError || countdown === 0) && (
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => setShowTroubleForm(true)}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                    >
                      Having Trouble Login?
                    </button>
                  </div>
                )}

                {/* Back link */}
                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setOtp("");
                    setErrors({});
                    setCountdown(0);
                  }}
                  className="mt-3 block w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Use a different email
                </button>
              </form>
            )}

            {/* Login Trouble Report Form Modal */}
            {showTroubleForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Report Login Issue
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Describe the issue you&apos;re experiencing and we&apos;ll look into it.
                  </p>

                  {/* Email (pre-filled) */}
                  <div className="mb-4">
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="h-10 w-full rounded-lg border border-input bg-secondary/50 px-3 text-sm text-muted-foreground"
                    />
                  </div>

                  {/* Error info (if available) */}
                  {lastError && (
                    <div className="mb-4 rounded-lg bg-destructive/10 p-3">
                      <p className="text-xs font-medium text-destructive">
                        Last Error: {lastError.type}
                      </p>
                      <p className="text-xs text-destructive/80 mt-1">
                        {lastError.message}
                      </p>
                    </div>
                  )}

                  {/* User message */}
                  <div className="mb-4">
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Describe the issue <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      value={troubleMessage}
                      onChange={(e) => setTroubleMessage(e.target.value)}
                      placeholder="e.g., I'm not receiving the OTP email, or the Google sign-in button is not working..."
                      rows={4}
                      className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTroubleForm(false);
                        setTroubleMessage("");
                      }}
                      className="flex-1 h-10 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleReportLoginIssue}
                      disabled={reportingIssue || !troubleMessage.trim()}
                      className="flex-1 h-10 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
                    >
                      {reportingIssue ? (
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      ) : (
                        "Submit Report"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
