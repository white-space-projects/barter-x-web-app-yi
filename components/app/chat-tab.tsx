/**
 * ============================================================================
 * CHAT TAB
 * ============================================================================
 * 
 * Handles notifications and direct messaging between users in a trade.
 * 
 * FEATURES:
 * - Notifications: adaptive cards with action buttons
 * - Conversations: direct chat with trade partners
 * - Delivery support requests
 * 
 * BACKEND INTEGRATION:
 * - GET /api/notifications - Fetch user notifications
 * - PUT /api/notifications/:id/read - Mark notification as read
 * - GET /api/conversations - Fetch user conversations
 * - GET /api/conversations/:id/messages - Fetch messages
 * - POST /api/messages - Send message
 * - POST /api/delivery-support - Request delivery support
 * 
 * NOTIFICATION ACTION TYPES:
 * - "confirm_pickup": Opens pickup readiness modal (via onOpenPickupModal callback)
 * - "view_chat": Opens the conversation view
 * - "view_offer": Navigates to view offer details
 * - "view_status": Shows status update info
 * 
 * REAL-TIME:
 * - Consider WebSocket connection for live message updates
 * - Poll notifications every 30s or use SSE
 * 
 * ============================================================================
 */

"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  MessageSquare,
  Bell,
  Send,
  Package,
  Check,
  CheckCheck,
  Clock,
  Truck,
  Loader2,
  ChevronRight,
  MapPin,
  AlertCircle,
  ArrowRightLeft,
} from "lucide-react";
import { useBarterStore } from "@/lib/store";
import { generateGuid } from "@/lib/guid";
import type { Notification, Conversation, ChatMessage } from "@/lib/types";

type ActiveView = "notifications" | "conversation";

type ChatTabProps = {
  /**
   * Callback to open the pickup readiness modal for a specific offer.
   * BACKEND NOTE: This allows the notification action to trigger the modal
   * without the chat-tab needing to manage the modal state itself.
   */
  onOpenPickupModal?: (offerId: string) => void;
};

export function ChatTab({ onOpenPickupModal }: ChatTabProps = {}) {
  const {
    auth,
    notifications,
    conversations,
    hooks,
    offers,
    products,
    getOfferById,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    getOrCreateConversation,
    addMessage,
    markConversationRead,
    requestDeliverySupport,
    getUnreadCount,
    getTotalUnreadMessages,
    updateHook,
    updateOffer,
  } = useBarterStore();

  const [activeView, setActiveView] = useState<ActiveView>("notifications");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get all conversations for current user (both as hooker and hookee)
  const myConversations = useMemo(() => {
    if (!auth.user) return [];
    
    // Get conversations where I'm the one who hooked
    const myHookConversations = conversations.filter((c) => {
      const myOffer = getOfferById(c.myOfferId);
      return myOffer?.ownerUserId === auth.user!.userId;
    });

    return myHookConversations;
  }, [conversations, auth.user, getOfferById]);

  // Get hooks on my offers (where others hooked my offer) for incoming chats
  const incomingHooks = useMemo(() => {
    if (!auth.user) return [];
    const myOfferIds = offers
      .filter((o) => o.ownerUserId === auth.user!.userId)
      .map((o) => o.offerId);
    return hooks.filter((h) => myOfferIds.includes(h.toOfferId) && 
      (h.status === "reserved" || h.status === "processing"));
  }, [hooks, offers, auth.user]);

  const currentConversation = selectedConversation
    ? conversations.find((c) => c.conversationId === selectedConversation)
    : null;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation?.messages]);

  // Removed demo notification generation to avoid duplicates
  // Notifications are now only created by actual user actions

  async function handleSendMessage() {
    if (!newMessage.trim() || !currentConversation || sending) return;

    setSending(true);
    addMessage(currentConversation.conversationId, newMessage.trim());
    setNewMessage("");

    // Simulate response
    await new Promise((r) => setTimeout(r, 1200));
    
    const responses = [
      "Thanks for reaching out! The item is ready for pickup.",
      "Sounds good! I'm available on weekends.",
      "Let me know if you need more details about the product.",
      "I can meet at the address I provided. Does that work?",
      "Great! Looking forward to completing this exchange.",
    ];
    
    // Simulate other user reply
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    addMessage(currentConversation.conversationId, randomResponse, false);
    
    setSending(false);
  }

  function handleNotificationAction(notification: Notification) {
    markNotificationRead(notification.notificationId);
    
    if (notification.actionType === "confirm_pickup" && notification.offerId) {
      // Open pickup readiness modal
      if (onOpenPickupModal) {
        onOpenPickupModal(notification.offerId);
      }
    } else if (notification.actionType === "view_chat" && notification.hookId) {
      const hook = hooks.find((h) => h.hookId === notification.hookId);
      if (hook) {
        const targetOffer = getOfferById(hook.toOfferId);
        const fromOffer = getOfferById(hook.fromOfferId);
        if (targetOffer && fromOffer) {
          const conv = getOrCreateConversation(
            hook.hookId,
            fromOffer.offerId,
            targetOffer.offerId,
            targetOffer.ownerUserId,
            "User"
          );
          setSelectedConversation(conv.conversationId);
          setActiveView("conversation");
        }
      }
    }
  }

  function openConversation(hookId: string) {
    const hook = hooks.find((h) => h.hookId === hookId);
    if (!hook) return;
    
    const targetOffer = getOfferById(hook.toOfferId);
    const fromOffer = getOfferById(hook.fromOfferId);
    if (!targetOffer || !fromOffer) return;

    const conv = getOrCreateConversation(
      hookId,
      fromOffer.offerId,
      targetOffer.offerId,
      targetOffer.ownerUserId,
      "User"
    );
    
    setSelectedConversation(conv.conversationId);
    markConversationRead(conv.conversationId);
    setActiveView("conversation");
  }

  function handleRequestDelivery() {
    if (!currentConversation) return;
    requestDeliverySupport(currentConversation.conversationId);
  }

  const unreadNotifications = getUnreadCount();
  const unreadMessages = getTotalUnreadMessages();

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
        <button
          onClick={() => {
            setActiveView("notifications");
            setSelectedConversation(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeView === "notifications" && !selectedConversation
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bell className="h-4 w-4" />
          Notifications
          {unreadNotifications > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
              {unreadNotifications}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveView("conversation")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeView === "conversation" || selectedConversation
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Messages
          {unreadMessages > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {unreadMessages}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Notifications view */}
        {activeView === "notifications" && !selectedConversation && (
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  You will receive notifications when your hooks are reserved or when users message you.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-w-lg">
                {notifications.length > 0 && unreadNotifications > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="self-end text-xs text-primary hover:underline mb-1"
                  >
                    Mark all as read
                  </button>
                )}
                {notifications.map((notification) => (
                  <NotificationCard
                    key={notification.notificationId}
                    notification={notification}
                    onAction={handleNotificationAction}
                    hooks={hooks}
                    getOfferById={getOfferById}
                    products={products}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conversations list */}
        {activeView === "conversation" && !selectedConversation && (
          <div className="flex-1 overflow-y-auto">
            {myConversations.length === 0 && incomingHooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Conversations will appear here when you or other users confirm pickup readiness.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-w-lg">
                {/* My outgoing hook conversations */}
                {myConversations.map((conv) => {
                  const targetOffer = getOfferById(conv.targetOfferId);
                  const targetProduct = targetOffer 
                    ? products.find((p) => p.productId === targetOffer.productId)
                    : null;
                  
                  return (
                    <button
                      key={conv.conversationId}
                      onClick={() => openConversation(conv.hookId || "")}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
                        {targetProduct?.imageUrl ? (
                          <img
                            src={targetProduct.imageUrl}
                            alt={targetOffer?.title}
                            className="h-full w-full object-cover"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {targetOffer?.title || "Unknown Offer"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.messages.length > 0
                            ? conv.messages[conv.messages.length - 1].content
                            : "No messages yet"}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                          {conv.unreadCount}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  );
                })}

                {/* Incoming hooks (others hooked my offer) */}
                {incomingHooks.map((hook) => {
                  const fromOffer = getOfferById(hook.fromOfferId);
                  const fromProduct = fromOffer
                    ? products.find((p) => p.productId === fromOffer.productId)
                    : null;
                  
                  return (
                    <button
                      key={hook.hookId}
                      onClick={() => openConversation(hook.hookId)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
                    >
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
                        {fromProduct?.imageUrl ? (
                          <img
                            src={fromProduct.imageUrl}
                            alt={fromOffer?.title}
                            className="h-full w-full object-cover"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-primary font-medium mb-0.5">Someone hooked your offer</p>
                        <p className="text-sm font-medium text-foreground truncate">
                          {fromOffer?.title || "Unknown Offer"}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Active conversation */}
        {selectedConversation && currentConversation && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Conversation header */}
            <ConversationHeader
              conversation={currentConversation}
              getOfferById={getOfferById}
              products={products}
              onBack={() => setSelectedConversation(null)}
              onRequestDelivery={handleRequestDelivery}
            />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-3">
                {currentConversation.messages.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Start the conversation to discuss pickup details.
                    </p>
                  </div>
                )}
                {currentConversation.messages.map((msg) => (
                  <MessageBubble
                    key={msg.messageId}
                    message={msg}
                    isMe={msg.senderId === auth.user?.userId}
                    onAdaptiveAction={(card) => {
                      if (card?.action.type === "confirm_pickup" && card.action.offerId) {
                        onOpenPickupModal?.(card.action.offerId);
                      }
                    }}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 h-10 rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={sending}
                />
                <button
                  onClick={handleSendMessage}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Adaptive Card style notification
function NotificationCard({
  notification,
  onAction,
  hooks,
  getOfferById,
  products,
}: {
  notification: Notification;
  onAction: (n: Notification) => void;
  hooks: any[];
  getOfferById: (id: string) => any;
  products: any[];
}) {
  const hook = notification.hookId ? hooks.find((h: any) => h.hookId === notification.hookId) : null;
  const offer = notification.offerId ? getOfferById(notification.offerId) : null;
  const targetOffer = hook ? getOfferById(hook.toOfferId) : null;
  const product = targetOffer ? products.find((p: any) => p.productId === targetOffer.productId) : null;

const iconMap: Record<string, JSX.Element> = {
  hook_reserved: <Clock className="h-4 w-4 text-primary" />,
  pickup_confirm: <Check className="h-4 w-4 text-green-500" />,
  chat_message: <MessageSquare className="h-4 w-4 text-blue-500" />,
  trade_committed: <CheckCheck className="h-4 w-4 text-green-500" />,
  delivery_requested: <Truck className="h-4 w-4 text-primary" />,
  direct_exchange_req: <ArrowRightLeft className="h-4 w-4 text-primary" />,
  status_update: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
  };

  return (
    <div
      className={`rounded-xl border bg-card overflow-hidden transition-all ${
        notification.read ? "border-border" : "border-primary/50 shadow-sm shadow-primary/10"
      }`}
    >
      {/* Card header accent line */}
      <div className={`h-1 ${notification.read ? "bg-muted" : "bg-primary"}`} />
      
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            notification.read ? "bg-secondary" : "bg-primary/10"
          }`}>
            {iconMap[notification.type] || <Bell className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{notification.title}</p>
            <p className="text-xs text-muted-foreground">
              {notification.timestamp.toLocaleString()}
            </p>
          </div>
          {!notification.read && (
            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
          )}
        </div>

        {/* Offer preview if available */}
        {targetOffer && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 mb-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
              {product?.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={targetOffer.title}
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <Package className="h-5 w-5 text-muted-foreground/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{targetOffer.title}</p>
              <p className="text-xs text-muted-foreground">
                {product?.subcategory} . {product?.brand}
              </p>
            </div>
          </div>
        )}

        {/* Message */}
        <p className="text-sm text-muted-foreground mb-3">{notification.message}</p>

        {/* Action button */}
        {notification.actionLabel && (
          <button
            onClick={() => onAction(notification)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {notification.actionLabel}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function ConversationHeader({
  conversation,
  getOfferById,
  products,
  onBack,
  onRequestDelivery,
}: {
  conversation: Conversation;
  getOfferById: (id: string) => any;
  products: any[];
  onBack: () => void;
  onRequestDelivery: () => void;
}) {
  const targetOffer = getOfferById(conversation.targetOfferId);
  const product = targetOffer ? products.find((p: any) => p.productId === targetOffer.productId) : null;

  return (
    <div className="border-b border-border p-4">
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Back
        </button>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
          {product?.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={targetOffer?.title}
              className="h-full w-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <Package className="h-5 w-5 text-muted-foreground/40" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{targetOffer?.title}</p>
          <p className="text-xs text-muted-foreground">
            {product?.subcategory} . {product?.brand}
          </p>
        </div>
      </div>

      {/* Address preview if available */}
      {targetOffer?.pickupAddress && targetOffer.readyForCommit && (
        <div className="mt-3 p-2 rounded-lg bg-secondary/50 flex items-start gap-2">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            {[
              targetOffer.pickupAddress.addressLine1,
              targetOffer.pickupAddress.city,
              targetOffer.pickupAddress.state,
              targetOffer.pickupAddress.zip,
              targetOffer.pickupAddress.country,
            ]
              .filter(Boolean)
              .join(", ")}
          </div>
        </div>
      )}

      {/* Delivery support button */}
      {!conversation.deliverySupportRequested && (
        <button
          onClick={onRequestDelivery}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        >
          <Truck className="h-3.5 w-3.5" />
          Request Pickup &amp; Delivery Support (+10)
        </button>
      )}
      {conversation.deliverySupportRequested && (
        <div className="mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-xs text-green-600">
          <Truck className="h-3.5 w-3.5" />
          Pickup &amp; Delivery Support Requested
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message, isMe, onAdaptiveAction }: { message: ChatMessage; isMe: boolean; onAdaptiveAction?: (card: ChatMessage["adaptiveCard"]) => void }) {
  // Adaptive card system message (actionable cards like "Confirm Pickup")
  if (message.isSystemMessage && message.adaptiveCard) {
    return (
      <div className="flex justify-center my-2">
        <div className="w-full max-w-sm rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
          <div className="h-1 bg-primary" />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">{message.adaptiveCard.title}</h4>
            </div>
            {message.adaptiveCard.description && (
              <p className="text-xs text-muted-foreground mb-3">{message.adaptiveCard.description}</p>
            )}
            <button
              onClick={() => onAdaptiveAction?.(message.adaptiveCard)}
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

  // Regular system message
  if (message.isSystemMessage) {
    return (
      <div className="flex justify-center">
        <p className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full max-w-[80%] text-center">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isMe
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-secondary text-foreground rounded-bl-sm"
        }`}
      >
        <p className="text-sm">{message.content}</p>
        <p
          className={`text-[10px] mt-1 ${
            isMe ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
