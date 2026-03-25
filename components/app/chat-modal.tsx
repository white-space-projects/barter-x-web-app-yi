"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Package } from "lucide-react";
import { useBarterStore } from "@/lib/store";
import { generateGuid } from "@/lib/guid";

type Props = {
  hookId: string;
  onClose: () => void;
};

type ChatMessage = {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
};

export function ChatModal({ hookId, onClose }: Props) {
  const { auth, hooks, getOfferById, products } = useBarterStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Find the hook and related offers
  const hook = hooks.find((h) => h.hookId === hookId);
  const targetOffer = hook ? getOfferById(hook.toOfferId) : null;
  const fromOffer = hook ? getOfferById(hook.fromOfferId) : null;
  const targetProduct = targetOffer ? products.find((p) => p.productId === targetOffer.productId) : null;

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simulate initial messages
  useEffect(() => {
    if (targetOffer) {
      // Mock some initial messages for demo
      const initialMessages: ChatMessage[] = [
        {
          id: generateGuid(),
          senderId: "system",
          content: `Chat started for exchanging "${fromOffer?.title}" with "${targetOffer.title}"`,
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        },
      ];
      setMessages(initialMessages);
    }
  }, [targetOffer, fromOffer]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: generateGuid(),
      senderId: auth.user!.userId,
      content: newMessage.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setNewMessage("");

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));

    // Simulate a response from the other user
    const responses = [
      "Sounds good! When would you like to meet?",
      "I can do pickup on weekends. Does that work for you?",
      "The item is in great condition. Let me know if you have any questions!",
      "I'm flexible with timing. What works best for you?",
      "Perfect! I'll prepare the item for pickup.",
    ];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    const otherUserMessage: ChatMessage = {
      id: generateGuid(),
      senderId: targetOffer?.ownerUserId || "other-user",
      content: randomResponse,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, otherUserMessage]);
    
    setSending(false);
  }

  if (!hook || !targetOffer) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card shadow-2xl flex flex-col h-[70vh] max-h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
              {targetProduct?.imageUrl ? (
                <img
                  src={targetProduct.imageUrl}
                  alt={targetOffer.title}
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <Package className="h-5 w-5 text-muted-foreground/40" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground truncate max-w-[200px]">
                {targetOffer.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {targetProduct?.subcategory} . {targetProduct?.brand}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-3">
            {messages.map((msg) => {
              const isMe = msg.senderId === auth.user?.userId;
              const isSystem = msg.senderId === "system";

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <p className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
                      {msg.content}
                    </p>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-secondary text-foreground rounded-bl-sm"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <form
          onSubmit={handleSendMessage}
          className="border-t border-border p-4"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-10 rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground text-center">
            Discuss pickup details, delivery options, or ask questions about the product.
          </p>
        </form>
      </div>
    </>
  );
}
