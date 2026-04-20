"use client";

import { useState, useRef } from "react";
import { 
  Bug, 
  Lightbulb, 
  Palette, 
  Sparkles, 
  MessageSquare,
  Upload,
  X,
  Send,
  CheckCircle,
  HelpCircle,
  Image as ImageIcon,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { useBarterStore } from "@/lib/store";

// Feedback types
const FEEDBACK_TYPES = [
  { id: "bug", label: "Bug / Issue", icon: Bug, color: "text-red-500", bgColor: "bg-red-500/10" },
  { id: "ux", label: "UX Improvement", icon: Lightbulb, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  { id: "ui", label: "UI / Design", icon: Palette, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { id: "feature", label: "Feature Idea", icon: Sparkles, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  { id: "general", label: "General", icon: MessageSquare, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
] as const;

type FeedbackType = typeof FEEDBACK_TYPES[number]["id"];

// Screen/Area options
const SCREEN_OPTIONS = [
  "Login / OTP",
  "Profile",
  "Products",
  "Product Details",
  "Offer Details",
  "Create Offer",
  "My Offers",
  "Hooked Offers",
  "Messages / Chat",
  "Testing Feedback",
  "Navigation",
  "General / Other",
];

// Feature/Flow options
const FEATURE_OPTIONS = [
  "Navigation",
  "Filtering / Search",
  "Product Browsing",
  "Offer Creation",
  "Hooking",
  "Pickup Confirmation",
  "Chat / Messaging",
  "Status Display",
  "Images / Photos",
  "Performance",
  "Notifications",
  "Other",
];

// Creative prompts
const CREATIVE_PROMPTS = [
  "What confused you?",
  "What felt slow or frustrating?",
  "What would make this screen easier?",
  "What would make this feel more trustworthy?",
  "Is there something missing?",
  "Have you seen another app do this better?",
];

export function TestingFeedbackTab() {
  const { auth } = useBarterStore();
  
  // Form state
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [screenArea, setScreenArea] = useState<string>("");
  const [featureFlow, setFeatureFlow] = useState<string>("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<{ 
    id: string; 
    previewUrl: string; 
    storagePath: string;
    originalFilename: string;
    fileSize: number;
    mimeType: string;
  }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection and upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    // No limit on attachments anymore
    const filesToProcess = Array.from(files);
    
    // Validate all files first
    for (const file of filesToProcess) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return;
      }
    }
    
    setIsUploading(true);
    
    try {
      for (const file of filesToProcess) {
        // Upload to server
        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", auth.user?.userId || "");
        
        const response = await fetch("/api/support/testing-feedback/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to upload image");
        }
        
        const result = await response.json();
        
        setAttachments(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            previewUrl: result.previewUrl,
            storagePath: result.storagePath,
            originalFilename: result.originalFilename,
            fileSize: result.fileSize,
            mimeType: result.mimeType,
          }
        ]);
      }
      
      toast.success(`${filesToProcess.length} image(s) uploaded`);
    } catch (error) {
      console.error("Failed to upload images:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload images");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  
  // Remove attachment
  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };
  
  // Handle submit
  const handleSubmit = async () => {
    if (!feedbackType) {
      toast.error("Please select a feedback type");
      return;
    }
    if (!message.trim()) {
      toast.error("Please describe your feedback");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/support/testing-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: auth.user?.userId,
          userEmail: auth.user?.email,
          feedbackType,
          screenArea: screenArea || undefined,
          featureFlow: featureFlow || undefined,
          message: message.trim(),
          // Include attachment storage paths for database persistence
          attachments: attachments.map(a => ({
            storagePath: a.storagePath,
            originalFilename: a.originalFilename,
            fileSize: a.fileSize,
            mimeType: a.mimeType,
          })),
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }
      
      setSubmitted(true);
      toast.success("Thank you for your feedback!");
      
      // Reset form after short delay
      setTimeout(() => {
        setFeedbackType(null);
        setScreenArea("");
        setFeatureFlow("");
        setMessage("");
        setAttachments([]);
        setSubmitted(false);
      }, 3000);
      
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Success state
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Thank You!</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Your feedback helps us make Barter-X better. We appreciate you taking the time to share your thoughts.
        </p>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto pb-32 lg:pb-8">
      {/* Intro Section */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">Help Us Improve Barter-X</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We&apos;re in testing phase and your feedback is invaluable. Share bugs, usability issues, 
              design suggestions, or ideas. Comment on any screen or feature - screenshots are helpful but optional.
            </p>
          </div>
        </div>
      </div>
      
      {/* Feedback Type Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-3">
          What kind of feedback is this?
        </label>
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_TYPES.map(type => {
            const Icon = type.icon;
            const isSelected = feedbackType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setFeedbackType(type.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  isSelected
                    ? `${type.bgColor} border-current ${type.color}`
                    : "border-border bg-card hover:bg-secondary/50 text-muted-foreground"
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? type.color : ""}`} />
                <span className="text-sm font-medium">{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Optional References */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Screen/Area */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Screen / Area <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <div className="relative">
            <select
              value={screenArea}
              onChange={(e) => setScreenArea(e.target.value)}
              className="w-full appearance-none bg-card border border-border rounded-lg px-3 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select screen...</option>
              {SCREEN_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        
        {/* Feature/Flow */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Feature / Flow <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <div className="relative">
            <select
              value={featureFlow}
              onChange={(e) => setFeatureFlow(e.target.value)}
              className="w-full appearance-none bg-card border border-border rounded-lg px-3 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select feature...</option>
              {FEATURE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>
      
      {/* Main Feedback Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          Your Feedback
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What did you notice? What felt unclear, difficult, or improvable? If you have an idea, how would you improve it?"
          rows={5}
          className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      </div>
      
      {/* Creative Prompts */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-2">Need inspiration? Consider:</p>
        <div className="flex flex-wrap gap-1.5">
          {CREATIVE_PROMPTS.map((prompt, index) => (
            <span
              key={index}
              className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground"
            >
              {prompt}
            </span>
          ))}
        </div>
      </div>
      
      {/* Attachments */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          Screenshots <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        
        <div className="flex flex-wrap gap-3">
          {/* Attachment previews */}
          {attachments.map(attachment => (
            <div
              key={attachment.id}
              className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-secondary"
            >
              <img
                src={attachment.previewUrl}
                alt={attachment.originalFilename}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          
          {/* Add button / Upload indicator */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-card flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                <span className="text-[10px] text-muted-foreground">Uploading</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Add</span>
              </>
            )}
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
      
      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || isUploading || !feedbackType || !message.trim()}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-medium py-3 px-4 rounded-xl transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit Feedback
          </>
        )}
      </button>
    </div>
  );
}
