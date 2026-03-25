"use client";

import React from "react"

import { GlobalNav } from "@/components/global-nav";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type FormErrors = {
  email?: string;
  message?: string;
};

export default function FeedbackPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Please enter a valid email.";
    }
    if (!message.trim()) {
      errs.message = "Question or feedback cannot be empty.";
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);

    toast.success(
      "Thank you for your feedback. We'll reach out if we have questions."
    );
    setEmail("");
    setPhone("");
    setMessage("");
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalNav />
      <main className="mx-auto max-w-xl px-4 py-12 lg:px-6 lg:py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance">
            Feedback & questions
          </h1>
          <p className="mt-2 text-base text-muted-foreground leading-relaxed text-pretty">
            Have a question, idea, or feedback about Barter-X? Leave us a note
            and we{"'"}ll get back to you.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-border bg-card p-6"
          noValidate
        >
          {/* Email */}
          <div className="mb-5">
            <label
              htmlFor="feedback-email"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Email <span className="text-destructive">*</span>
            </label>
            <input
              id="feedback-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="you@example.com"
              className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="mb-5">
            <label
              htmlFor="feedback-phone"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Phone <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="feedback-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+31 6 12345678"
              className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Message */}
          <div className="mb-6">
            <label
              htmlFor="feedback-message"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Question / feedback <span className="text-destructive">*</span>
            </label>
            <textarea
              id="feedback-message"
              rows={5}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message)
                  setErrors((p) => ({ ...p, message: undefined }));
              }}
              placeholder="Tell us what's on your mind..."
              className="w-full rounded-lg border border-input bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            {errors.message && (
              <p className="mt-1 text-xs text-destructive">{errors.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Submit"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
