"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Package,
  MapPin,
  Mail,
  Calendar,
  Clock,
  ChevronDown,
  Link2,
  CheckCircle2,
  Circle,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface Offer {
  id: string;
  title: string;
  category: string;
  brand: string;
  imageUrl?: string;
  hooksCount: number;
  maxHooks: number;
  status: "available" | "reserved" | "processing";
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
}

interface Conversation {
  id: string;
  myOffer: Offer;
  hookedOffer: Offer;
  partnerName: string;
  partnerEmail: string;
  partnerPhone?: string;
  partnerLocation: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  messages: Message[];
  exchangeStatus: "pending" | "confirmed" | "in_progress" | "completed";
  firstInteraction: Date;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    myOffer: {
      id: "offer-1",
      title: "iPhone 14 Pro",
      category: "Phones",
      brand: "Apple",
      hooksCount: 2,
      maxHooks: 3,
      status: "reserved",
    },
    hookedOffer: {
      id: "offer-2",
      title: "MacBook Air M2",
      category: "Laptops",
      brand: "Apple",
      hooksCount: 1,
      maxHooks: 3,
      status: "available",
    },
    partnerName: "Alex Thompson",
    partnerEmail: "alex.thompson@email.com",
    partnerPhone: "+31 6 1234 5678",
    partnerLocation: "Amsterdam, Netherlands",
    lastMessage: "Yes, I can meet tomorrow at 2pm. Does that work for you?",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
    unreadCount: 2,
    messages: [
      {
        id: "m1",
        senderId: "partner",
        senderName: "Alex Thompson",
        content: "Hi! I saw your iPhone offer. I have a MacBook Air M2 that I would like to exchange.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        isOwn: false,
      },
      {
        id: "m2",
        senderId: "me",
        senderName: "You",
        content: "Hey Alex! That sounds great. The iPhone is in excellent condition, barely used. What about the MacBook?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
        isOwn: true,
      },
      {
        id: "m3",
        senderId: "partner",
        senderName: "Alex Thompson",
        content: "The MacBook is also in great condition. I bought it 6 months ago. Battery health is at 98%.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        isOwn: false,
      },
      {
        id: "m4",
        senderId: "me",
        senderName: "You",
        content: "Perfect! When would you be available to meet for the exchange?",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        isOwn: true,
      },
      {
        id: "m5",
        senderId: "partner",
        senderName: "Alex Thompson",
        content: "Yes, I can meet tomorrow at 2pm. Does that work for you?",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        isOwn: false,
      },
    ],
    exchangeStatus: "confirmed",
    firstInteraction: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
  },
  {
    id: "2",
    myOffer: {
      id: "offer-3",
      title: "Sony WH-1000XM5",
      category: "Audio",
      brand: "Sony",
      hooksCount: 1,
      maxHooks: 3,
      status: "available",
    },
    hookedOffer: {
      id: "offer-4",
      title: "iPad Pro 11",
      category: "Tablets",
      brand: "Apple",
      hooksCount: 3,
      maxHooks: 3,
      status: "reserved",
    },
    partnerName: "Sarah Chen",
    partnerEmail: "sarah.chen@email.com",
    partnerLocation: "Rotterdam, Netherlands",
    lastMessage: "Let me think about it and get back to you.",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 3),
    unreadCount: 0,
    messages: [
      {
        id: "m6",
        senderId: "me",
        senderName: "You",
        content: "Hi Sarah! Interested in your iPad Pro. Would you consider my Sony headphones?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
        isOwn: true,
      },
      {
        id: "m7",
        senderId: "partner",
        senderName: "Sarah Chen",
        content: "Let me think about it and get back to you.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
        isOwn: false,
      },
    ],
    exchangeStatus: "pending",
    firstInteraction: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    id: "3",
    myOffer: {
      id: "offer-5",
      title: "Nintendo Switch OLED",
      category: "Gaming",
      brand: "Nintendo",
      hooksCount: 0,
      maxHooks: 3,
      status: "available",
    },
    hookedOffer: {
      id: "offer-6",
      title: "PS5 Controller",
      category: "Gaming",
      brand: "Sony",
      hooksCount: 2,
      maxHooks: 3,
      status: "available",
    },
    partnerName: "Mike Johnson",
    partnerEmail: "mike.j@email.com",
    partnerPhone: "+31 6 9876 5432",
    partnerLocation: "Utrecht, Netherlands",
    lastMessage: "Great! Looking forward to the exchange.",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
    unreadCount: 0,
    messages: [
      {
        id: "m8",
        senderId: "partner",
        senderName: "Mike Johnson",
        content: "Hey! I see you have a Switch OLED. I have a PS5 controller I would like to trade.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26),
        isOwn: false,
      },
      {
        id: "m9",
        senderId: "me",
        senderName: "You",
        content: "Sounds good Mike! The Switch is in mint condition.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25),
        isOwn: true,
      },
      {
        id: "m10",
        senderId: "partner",
        senderName: "Mike Johnson",
        content: "Great! Looking forward to the exchange.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        isOwn: false,
      },
    ],
    exchangeStatus: "in_progress",
    firstInteraction: new Date(Date.now() - 1000 * 60 * 60 * 26),
  },
];

// ============================================================================
// COMPONENTS
// ============================================================================

function OfferCardCompact({ offer, variant = "top" }: { offer: Offer; variant?: "top" | "bottom" }) {
  const statusColors = {
    available: "text-green-500 bg-green-500/10 border-green-500/30",
    reserved: "text-primary bg-primary/10 border-primary/30",
    processing: "text-blue-500 bg-blue-500/10 border-blue-500/30",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 bg-card",
        variant === "top" ? "rounded-t-xl border-t border-x border-border" : "rounded-b-xl border border-border"
      )}
    >
      {/* Product image placeholder */}
      <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
        <Package className="h-6 w-6 text-muted-foreground/50" />
      </div>

      {/* Offer info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{offer.title}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {offer.category}
          <span className="inline-block w-1 h-1 rounded-full bg-primary" />
          {offer.brand}
        </p>
        <p className="text-xs text-primary">
          Hooks {offer.hooksCount}/{offer.maxHooks}
        </p>
      </div>

      {/* Status badge */}
      <div
        className={cn(
          "px-2 py-1 rounded text-xs font-medium border capitalize",
          statusColors[offer.status]
        )}
      >
        {offer.status}
      </div>
    </div>
  );
}

function StackedOfferCards({
  myOffer,
  hookedOffer,
  isSelected,
  unreadCount,
  onClick,
}: {
  myOffer: Offer;
  hookedOffer: Offer;
  isSelected: boolean;
  unreadCount: number;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-all relative",
        isSelected ? "ring-2 ring-primary rounded-xl" : "hover:opacity-90"
      )}
    >
      {/* Unread badge */}
      {unreadCount > 0 && (
        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center z-10">
          {unreadCount}
        </div>
      )}
      
      {/* Container with gold left border to show linkage */}
      <div className="border-l-2 border-primary rounded-xl overflow-hidden">
        {/* My Offer (top) */}
        <OfferCardCompact offer={myOffer} variant="top" />
        
        {/* Divider with link icon */}
        <div className="relative h-0 border-t border-dashed border-primary/40">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border border-primary/40 flex items-center justify-center">
            <Link2 className="h-3 w-3 text-primary" />
          </div>
        </div>
        
        {/* Hooked Offer (bottom) */}
        <OfferCardCompact offer={hookedOffer} variant="bottom" />
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
    MOCK_CONVERSATIONS[0]
  );
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat" | "details">("list");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredConversations = MOCK_CONVERSATIONS.filter(
    (conv) =>
      conv.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.myOffer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.hookedOffer.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    // In a real app, this would send the message to the backend
    setMessageInput("");
  };

  const exchangeStatusConfig = {
    pending: { label: "Pending", color: "text-muted-foreground", icon: Circle },
    confirmed: { label: "Confirmed", color: "text-primary", icon: CheckCircle2 },
    in_progress: { label: "In Progress", color: "text-blue-500", icon: Clock },
    completed: { label: "Completed", color: "text-green-500", icon: CheckCircle2 },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-primary">BARTER-X</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/how-it-works"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                How it works
              </Link>
              <Link
                href="/feedback"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Feedback & questions
              </Link>
              <Link href="/chat" className="text-sm text-primary font-medium">
                Chat
              </Link>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Login
              </Link>
              <Link
                href="/workspace"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-4 py-4 space-y-3">
              <Link href="/" className="block text-sm text-muted-foreground">
                Dashboard
              </Link>
              <Link href="/how-it-works" className="block text-sm text-muted-foreground">
                How it works
              </Link>
              <Link href="/feedback" className="block text-sm text-muted-foreground">
                Feedback & questions
              </Link>
              <Link href="/chat" className="block text-sm text-primary font-medium">
                Chat
              </Link>
              <div className="pt-3 border-t border-border flex gap-3">
                <Link
                  href="/login"
                  className="flex-1 text-center rounded-md border border-border px-4 py-2 text-sm"
                >
                  Login
                </Link>
                <Link
                  href="/workspace"
                  className="flex-1 text-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Chat Interface */}
      <div className="h-[calc(100vh-57px)] flex">
        {/* Left Column - Conversations List */}
        <div
          className={cn(
            "w-full md:w-[400px] border-r border-border flex flex-col bg-background",
            mobileView !== "list" && "hidden md:flex"
          )}
        >
          {/* Search Header */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <StackedOfferCards
                  key={conv.id}
                  myOffer={conv.myOffer}
                  hookedOffer={conv.hookedOffer}
                  isSelected={selectedConversation?.id === conv.id}
                  unreadCount={conv.unreadCount}
                  onClick={() => {
                    setSelectedConversation(conv);
                    setMobileView("chat");
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Middle Column - Chat Messages */}
        <div
          className={cn(
            "flex-1 flex flex-col bg-background",
            mobileView !== "chat" && "hidden md:flex"
          )}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="h-14 px-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Mobile back button */}
                  <button
                    onClick={() => setMobileView("list")}
                    className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {selectedConversation.partnerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.myOffer.title} ↔ {selectedConversation.hookedOffer.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMobileView("details")}
                    className="md:hidden p-2 text-muted-foreground hover:text-foreground"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  <button className="hidden md:flex p-2 text-muted-foreground hover:text-foreground">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button className="hidden md:flex p-2 text-muted-foreground hover:text-foreground">
                    <Video className="h-5 w-5" />
                  </button>
                  <button className="hidden md:flex p-2 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Date separator */}
                <div className="flex items-center justify-center">
                  <span className="px-3 py-1 rounded-full bg-secondary text-xs text-muted-foreground">
                    {formatDate(selectedConversation.messages[0]?.timestamp || new Date())}
                  </span>
                </div>

                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn("flex flex-col gap-1", message.isOwn ? "items-end" : "items-start")}
                  >
                    {/* Sender name and time */}
                    <div className="flex items-center gap-2 px-1">
                      {!message.isOwn && (
                        <span className="text-xs font-medium text-foreground">
                          {message.senderName}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                      </span>
                      {message.isOwn && (
                        <span className="text-xs font-medium text-foreground">You</span>
                      )}
                    </div>

                    {/* Message bubble */}
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                        message.isOwn
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-foreground rounded-bl-md"
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">Select a conversation</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a conversation from the left to start chatting
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Contact & Exchange Details */}
        <div
          className={cn(
            "w-full md:w-[320px] border-l border-border bg-background overflow-y-auto",
            mobileView !== "details" && "hidden md:block"
          )}
        >
          {selectedConversation ? (
            <div className="p-4">
              {/* Mobile back button */}
              <button
                onClick={() => setMobileView("chat")}
                className="md:hidden flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to chat
              </button>

              {/* Partner Info */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-foreground">
                    {selectedConversation.partnerName.charAt(0)}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {selectedConversation.partnerName}
                </h3>
                <p className="text-sm text-muted-foreground">Trading Partner</p>
              </div>

              {/* Exchange Status */}
              <div className="mb-6 p-4 rounded-xl bg-card border border-border">
                <h4 className="text-sm font-medium text-foreground mb-3">Exchange Status</h4>
                <div className="flex items-center gap-2">
                  {(() => {
                    const config = exchangeStatusConfig[selectedConversation.exchangeStatus];
                    const Icon = config.icon;
                    return (
                      <>
                        <Icon className={cn("h-5 w-5", config.color)} />
                        <span className={cn("text-sm font-medium", config.color)}>
                          {config.label}
                        </span>
                      </>
                    );
                  })()}
                </div>

                {/* Offer Summary */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Your Offer</span>
                    <span className="text-foreground font-medium">
                      {selectedConversation.myOffer.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    <Link2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Their Offer</span>
                    <span className="text-foreground font-medium">
                      {selectedConversation.hookedOffer.title}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center justify-between">
                  Contact Details
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <a
                        href={`mailto:${selectedConversation.partnerEmail}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {selectedConversation.partnerEmail}
                      </a>
                    </div>
                  </div>
                  {selectedConversation.partnerPhone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <a
                          href={`tel:${selectedConversation.partnerPhone}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {selectedConversation.partnerPhone}
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm text-foreground">
                        {selectedConversation.partnerLocation}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">First Interaction</p>
                      <p className="text-sm text-foreground">
                        {formatDate(selectedConversation.firstInteraction)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <button className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  Confirm Exchange
                </button>
                <button className="w-full px-4 py-2.5 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
                  Report Issue
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Select a conversation to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
