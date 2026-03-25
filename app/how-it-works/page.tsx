"use client";

import { GlobalNav } from "@/components/global-nav";

const STEPS = [
  {
    number: 1,
    title: "Add an offer",
    description:
      "To get something back, start by offering something you already own. Add your item into the right product box. Each offer can hook up to three other offers, but you still get back only one.",
  },
  {
    number: 2,
    title: "Hook an offer",
    description:
      "Browse other people's offers and choose what you want in exchange. For each of your offers, you can hook up to three offers from other users. Each of your offers still returns one item.",
  },
  {
    number: 3,
    title: "Confirm pickup readiness",
    description:
      "As soon as you hook at least one product, the trade engine starts forming short, simple cycles that connect everyone's wants. Before anything is locked in, you confirm when and how your offer can be picked up.",
  },
  {
    number: 4,
    title: "Final commit",
    description:
      "Once everyone in a reserved cycle confirms pickup readiness, the trade engine commits the loop, triggers the chosen logistics, and each user gets what they wanted in exchange for their own offer.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <GlobalNav />
      <main className="mx-auto max-w-4xl px-4 py-12 lg:px-6 lg:py-16">
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl text-balance">
            How it works
          </h1>
          <p className="mt-3 text-base text-muted-foreground lg:text-lg leading-relaxed text-pretty">
            Barter-X is a marketplace where people exchange used products
            without money. Here{"'"}s how it works in four simple steps.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
            >
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                {step.number}
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {step.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed text-pretty">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Ready to start trading?
          </p>
          <a
            href="/login"
            className="mt-3 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get started
          </a>
        </div>
      </main>
    </div>
  );
}
