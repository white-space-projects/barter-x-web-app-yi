"use client";

import { Check } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

type Props = {
  message: ChatMessage;
  onAction?: (card: ChatMessage["adaptiveCard"]) => void;
};

export function AdaptiveCardMessage({ message, onAction }: Props) {
  if (!message.adaptiveCard) return null;
  
  return (
    <div className="flex justify-center my-2">
      <div className="w-full max-w-sm rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
        <div className="h-1 bg-primary" />
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Check className="h-4 w-4 text-primary" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">
              {message.adaptiveCard.title}
            </h4>
          </div>
          {message.adaptiveCard.description && (
            <p className="text-xs text-muted-foreground mb-3">
              {message.adaptiveCard.description}
            </p>
          )}
          <button
            onClick={() => onAction?.(message.adaptiveCard)}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {message.adaptiveCard.action.label}
          </button>
        </div>
        <div className="px-4 pb-2">
          <p className="text-[10px] text-muted-foreground text-center">
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    </div>
  );
}
