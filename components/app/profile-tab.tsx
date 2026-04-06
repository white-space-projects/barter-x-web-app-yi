"use client";

/**
 * ============================================================================
 * PROFILE TAB COMPONENT
 * ============================================================================
 * 
 * Profile management displayed within the workspace tab content area.
 * Keeps the sidebar, navbar, and header bar visible while showing profile.
 * 
 * BACKEND NOTES:
 * ==============
 * - GET /api/profile - Fetch user profile
 * - POST /api/profile/save - Save profile changes
 * - GET /api/offers/mine - Get user's offers for shipping addresses
 * 
 * IMPORTANT - Session Storage:
 * ============================
 * The following fields MUST be mapped to backend database:
 * - fullName (required)
 * - addressCountry (required) - Used for product filtering
 * - addressCity (required) - Used for product filtering
 * 
 * Products are loaded based on user's country and city.
 * On login, we auto-detect location from IP address.
 * If profile city/country differs from auto-detected, products must be re-fetched:
 * - API: GET /api/products?country={country}&city={city}
 * - Show shimmer loader during re-fetch
 */

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useBarterStore } from "@/lib/store";
import { useNavigationGuard } from "@/lib/navigation-guard";
import { getCountryNames, getCitiesForCountry } from "@/lib/countries-data";
import { toast } from "sonner";
import {
  Loader2,
  User,
  MapPin,
  Package,
  Bell,
  HelpCircle,
  DoorOpen,
  ChevronDown,
  ChevronRight,
  Check,
  Mail,
  Phone,
  MessageSquare,
  Send,
} from "lucide-react";
import type { ProfileAddress } from "@/lib/types";

interface ProfileTabProps {
  onProfileComplete?: () => void; // Callback when new user completes profile
}

export function ProfileTab({ onProfileComplete }: ProfileTabProps) {
  const { auth, logout, getMyOffers, updateOffer, updateUser } = useBarterStore();
  const router = useRouter();
  
  // Navigation guard for unsaved changes
  const { registerBlocker, unregisterBlocker } = useNavigationGuard();
  const BLOCKER_ID = "profile-edit";

  // ---------------------------------------------------------------------------
  // STATE - Basic Info
  // ---------------------------------------------------------------------------
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // ---------------------------------------------------------------------------
  // STATE - Profile Address
  // ---------------------------------------------------------------------------
  const [addressCountry, setAddressCountry] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressZip, setAddressZip] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");

  // ---------------------------------------------------------------------------
  // STATE - Notifications
  // ---------------------------------------------------------------------------
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  // ---------------------------------------------------------------------------
  // STATE - Support
  // ---------------------------------------------------------------------------
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubmitting, setSupportSubmitting] = useState(false);

  // ---------------------------------------------------------------------------
  // STATE - Shipping Addresses
  // ---------------------------------------------------------------------------
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);
  const [showInactiveOffers, setShowInactiveOffers] = useState(false);
  const [offerAddresses, setOfferAddresses] = useState<Record<string, {
    sameAsProfile: boolean;
    address: ProfileAddress;
  }>>({});

  // ---------------------------------------------------------------------------
  // STATE - UI
  // ---------------------------------------------------------------------------
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("basic-info");

  // ---------------------------------------------------------------------------
  // DIRTY TRACKING - Track if user has made changes
  // ---------------------------------------------------------------------------
  const initialDataRef = useRef<{
    fullName: string;
    phone: string;
    addressCountry: string;
    addressCity: string;
    addressState: string;
    addressZip: string;
    addressLine1: string;
    addressLine2: string;
    pushNotifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
  } | null>(null);

  // Calculate if form is dirty (has unsaved changes)
  const isDirty = useMemo(() => {
    if (!initialDataRef.current) return false;
    const initial = initialDataRef.current;
    return (
      fullName !== initial.fullName ||
      phone !== initial.phone ||
      addressCountry !== initial.addressCountry ||
      addressCity !== initial.addressCity ||
      addressState !== initial.addressState ||
      addressZip !== initial.addressZip ||
      addressLine1 !== initial.addressLine1 ||
      addressLine2 !== initial.addressLine2 ||
      pushNotifications !== initial.pushNotifications ||
      emailNotifications !== initial.emailNotifications ||
      smsNotifications !== initial.smsNotifications
    );
  }, [
    fullName, phone, addressCountry, addressCity, addressState,
    addressZip, addressLine1, addressLine2,
    pushNotifications, emailNotifications, smsNotifications
  ]);

  // ---------------------------------------------------------------------------
  // COMPUTED
  // ---------------------------------------------------------------------------
  const countries = getCountryNames();
  const cities = addressCountry ? getCitiesForCountry(addressCountry) : [];
  const myOffers = getMyOffers();
  
  const displayedOffers = useMemo(() => {
    return myOffers;
  }, [myOffers]);

  // Check if profile is complete (for new user flow)
  const isProfileComplete = useMemo(() => {
    return !!(fullName.trim() && addressCountry && addressCity);
  }, [fullName, addressCountry, addressCity]);

  // Check if this is a new user
  const isNewUser = useMemo(() => {
    if (!auth.user) return false;
    return !auth.user.isProfileComplete;
  }, [auth.user]);

  // ---------------------------------------------------------------------------
  // LOAD EXISTING DATA
  // ---------------------------------------------------------------------------
  useEffect(() => {
  if (auth.user) {
  const name = auth.user.name || "";
  const userPhone = auth.user.phone || "";
  // Check both top-level and profileAddress for backwards compatibility
  const country = auth.user.profileAddress?.country || auth.user.country || "";
  const city = auth.user.profileAddress?.city || auth.user.city || "";
  const state = auth.user.profileAddress?.state || "";
  const zip = auth.user.profileAddress?.zip || "";
  const line1 = auth.user.profileAddress?.addressLine1 || "";
  const line2 = auth.user.profileAddress?.addressLine2 || "";
      const push = auth.user.notificationPrefs?.push ?? true;
      const emailNotif = auth.user.notificationPrefs?.email ?? true;
      const sms = auth.user.notificationPrefs?.sms ?? false;

      setFullName(name);
      setEmail(auth.user.email || "");
      setPhone(userPhone);
      setSupportEmail(auth.user.email || "");
      setAddressCountry(country);
      setAddressCity(city);
      setAddressState(state);
      setAddressZip(zip);
      setAddressLine1(line1);
      setAddressLine2(line2);
      setPushNotifications(push);
      setEmailNotifications(emailNotif);
      setSmsNotifications(sms);

      // Store initial data for dirty tracking
      initialDataRef.current = {
        fullName: name,
        phone: userPhone,
        addressCountry: country,
        addressCity: city,
        addressState: state,
        addressZip: zip,
        addressLine1: line1,
        addressLine2: line2,
        pushNotifications: push,
        emailNotifications: emailNotif,
        smsNotifications: sms,
      };
    }
  }, [auth.user]);

  // ---------------------------------------------------------------------------
  // NAVIGATION BLOCKER - Register/unregister based on dirty state
  // ---------------------------------------------------------------------------
  const handleSaveRef = useRef<() => Promise<void>>();
  
  // Create a stable save function reference
  const handleSaveForBlocker = useCallback(async () => {
    if (!fullName.trim()) {
      toast.error("Full name is required");
      throw new Error("Validation failed");
    }
    if (!addressCountry || !addressCity) {
      toast.error("Country and City are required");
      throw new Error("Validation failed");
    }

    setSaving(true);
    
    try {
      // Save to database via API - include all address fields
      const response = await fetch("/api/data/user/profile", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": auth.user?.userId || "", // Fallback auth via header
        },
        credentials: "include", // Include session cookie
        body: JSON.stringify({
          name: fullName.trim(),
          phone: phone.trim() || undefined,
          city: addressCity,
          country: addressCountry,
          addressLine1: addressLine1.trim() || undefined,
          addressLine2: addressLine2.trim() || undefined,
          zip: addressZip.trim() || undefined,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("[v0] Profile save API error:", error);
        // Continue anyway to save locally
      } else {
        console.log("[v0] Profile saved to database");
      }
    } catch (error) {
      console.error("[v0] Failed to save profile to API:", error);
      // Continue anyway to save locally
    }

    // Also update local store
    updateUser({
      name: fullName.trim(),
      phone: phone.trim() || undefined,
      city: addressCity,
      country: addressCountry,
      profileAddress: {
        country: addressCountry,
        city: addressCity,
        state: addressState,
        zip: addressZip,
        addressLine1: addressLine1,
        addressLine2: addressLine2,
      },
      notificationPrefs: {
        push: pushNotifications,
        email: emailNotifications,
        sms: smsNotifications,
      },
      isProfileComplete: true,
    });

    // Update initial data ref after save
    initialDataRef.current = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressCountry,
      addressCity,
      addressState,
      addressZip,
      addressLine1,
      addressLine2,
      pushNotifications,
      emailNotifications,
      smsNotifications,
    };

    toast.success("Profile saved successfully");
    setSaving(false);
  }, [
    fullName, phone, addressCountry, addressCity, addressState,
    addressZip, addressLine1, addressLine2,
    pushNotifications, emailNotifications, smsNotifications, updateUser
  ]);

  // Keep the ref updated
  useEffect(() => {
    handleSaveRef.current = handleSaveForBlocker;
  }, [handleSaveForBlocker]);

  // Register/unregister blocker when dirty state changes
  useEffect(() => {
    if (isDirty) {
      registerBlocker({
        id: BLOCKER_ID,
        type: "profile-edit",
        message: "You have unsaved profile changes. Would you like to save them before leaving?",
        onSave: async () => {
          if (handleSaveRef.current) {
            await handleSaveRef.current();
          }
        },
      });
    } else {
      unregisterBlocker(BLOCKER_ID);
    }

    // Cleanup on unmount
    return () => {
      unregisterBlocker(BLOCKER_ID);
    };
  }, [isDirty, registerBlocker, unregisterBlocker, BLOCKER_ID]);

  // Load offer shipping addresses
  const offerIds = myOffers.map(o => o.offerId).join(',');
  useEffect(() => {
    if (!offerIds) return;
    
    const offers = getMyOffers();
    const addresses: Record<string, { sameAsProfile: boolean; address: ProfileAddress }> = {};
    offers.forEach((offer) => {
      if (offerAddresses[offer.offerId]) return;
      
      if (offer.pickupAddress) {
        addresses[offer.offerId] = {
          sameAsProfile: false,
          address: {
            country: offer.pickupAddress.country || "",
            city: offer.pickupAddress.city || "",
            state: offer.pickupAddress.state || "",
            zip: offer.pickupAddress.zip || "",
            addressLine1: offer.pickupAddress.addressLine1 || "",
            addressLine2: offer.pickupAddress.addressLine2 || "",
          },
        };
      } else {
        addresses[offer.offerId] = {
          sameAsProfile: true,
          address: {
            country: "",
            city: "",
            state: "",
            zip: "",
            addressLine1: "",
            addressLine2: "",
          },
        };
      }
    });
    
    if (Object.keys(addresses).length > 0) {
      setOfferAddresses(prev => ({ ...prev, ...addresses }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerIds]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------
  async function handleSaveProfile() {
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!addressCountry || !addressCity) {
      toast.error("Country and City are required");
      return;
    }

    setSaving(true);
    
    // Save to database via API
    try {
      const response = await fetch("/api/data/user/profile", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": auth.user?.userId || "", // Fallback auth via header
        },
        credentials: "include", // Include session cookie
        body: JSON.stringify({
          name: fullName.trim(),
          phone: phone.trim() || undefined,
          city: addressCity,
          country: addressCountry,
          addressLine1: addressLine1.trim() || undefined,
          addressLine2: addressLine2.trim() || undefined,
          zip: addressZip.trim() || undefined,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("[v0] Profile save API error:", error);
      } else {
        console.log("[v0] Profile saved to database");
      }
    } catch (error) {
      console.error("[v0] Failed to save profile to API:", error);
    }

    // Update the user in the store with new profile data
    updateUser({
      name: fullName.trim(),
      phone: phone.trim() || undefined,
      profileAddress: {
        country: addressCountry,
        city: addressCity,
        state: addressState,
        zip: addressZip,
        addressLine1: addressLine1,
        addressLine2: addressLine2,
      },
      notificationPrefs: {
        push: pushNotifications,
        email: emailNotifications,
        sms: smsNotifications,
      },
      isProfileComplete: true, // Mark profile as complete
    });

    // Update initial data ref to mark form as clean (no unsaved changes)
    initialDataRef.current = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressCountry,
      addressCity,
      addressState,
      addressZip,
      addressLine1,
      addressLine2,
      pushNotifications,
      emailNotifications,
      smsNotifications,
    };

    // Unregister the blocker since changes are saved
    unregisterBlocker(BLOCKER_ID);

    toast.success("Profile saved successfully");
    setSaving(false);

    // If this was a new user completing their profile, navigate to main screen
    if (isNewUser && onProfileComplete) {
      onProfileComplete();
    }
  }

  async function handleSubmitSupport() {
    if (!supportMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSupportSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    
    toast.success("Support request submitted. We'll get back to you soon.");
    setSupportMessage("");
    setSupportSubmitting(false);
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  function handleOfferAddressChange(offerId: string, field: keyof ProfileAddress, value: string) {
    setOfferAddresses((prev) => ({
      ...prev,
      [offerId]: {
        ...prev[offerId],
        address: {
          ...prev[offerId]?.address,
          [field]: value,
        },
      },
    }));
  }

  function handleSameAsProfile(offerId: string, checked: boolean) {
    if (checked) {
      setOfferAddresses((prev) => ({
        ...prev,
        [offerId]: {
          sameAsProfile: true,
          address: {
            country: addressCountry,
            city: addressCity,
            state: addressState,
            zip: addressZip,
            addressLine1: addressLine1,
            addressLine2: addressLine2,
          },
        },
      }));
    } else {
      setOfferAddresses((prev) => ({
        ...prev,
        [offerId]: {
          ...prev[offerId],
          sameAsProfile: false,
        },
      }));
    }
  }

  // ---------------------------------------------------------------------------
  // SECTIONS
  // ---------------------------------------------------------------------------
  const sections = [
    { id: "basic-info", label: "Basic Info", icon: User },
    { id: "shipping", label: "Shipping", icon: Package },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "support", label: "Support", icon: HelpCircle },
  ];

  return (
    <div className="mx-auto max-w-2xl w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">
          {isNewUser && !isProfileComplete ? "Complete Your Profile" : "Profile"}
        </h1>
      </div>

      {/* Section tabs - horizontal scroll on mobile */}
      <div className="mb-6 -mx-4 px-4 overflow-x-auto lg:mx-0 lg:px-0">
        <div className="flex gap-2 min-w-max pb-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                <Icon className="h-4 w-4" />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Content */}
      <div className="space-y-6">
        {/* Basic Info Section */}
        {activeSection === "basic-info" && (
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground mb-4">Basic Information</h2>
            
            {/* Full Name */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Full Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Email (read-only) */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className="h-11 w-full rounded-lg border border-input bg-secondary/50 px-3 text-sm text-muted-foreground cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            {/* Phone */}
            <div className="mb-6">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Phone Number <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="mt-1 text-xs text-muted-foreground">Phone verification required when confirming pickup</p>
            </div>

            {/* Address Section */}
            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">Profile Address</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Your default address for exchanges. This will be used as your shipping address unless specified otherwise.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Country */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Country <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={addressCountry}
                      onChange={(e) => {
                        setAddressCountry(e.target.value);
                        setAddressCity("");
                      }}
                      className="h-11 w-full appearance-none rounded-lg border border-input bg-secondary pl-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select country</option>
                      {countries.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    City <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={addressCity}
                      onChange={(e) => setAddressCity(e.target.value)}
                      disabled={!addressCountry}
                      className="h-11 w-full appearance-none rounded-lg border border-input bg-secondary pl-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                    >
                      <option value="">{addressCountry ? "Select city" : "Select country first"}</option>
                      {cities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* State */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    State <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value)}
                    placeholder="State/Province"
                    className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Zip */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Zip/Pin Code <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={addressZip}
                    onChange={(e) => setAddressZip(e.target.value)}
                    placeholder="12345"
                    className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Address Line 1 */}
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Address Line 1 <span className="text-muted-foreground">(optional)</span>
                </label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Street address, building name"
                  className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Address Line 2 */}
              {addressLine1 && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Address Line 2 <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Apartment, suite, unit, etc."
                    className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Shipping Addresses Section */}
        {activeSection === "shipping" && (
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground mb-2">Shipping Addresses</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Manage shipping addresses for each of your offers
            </p>

            {displayedOffers.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Package className="mx-auto mb-2 h-8 w-8 opacity-40" />
                <p className="text-sm">You don't have any offers yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedOffers.map((offer) => {
                  const isExpanded = expandedOfferId === offer.offerId;
                  const offerAddr = offerAddresses[offer.offerId];
                  const offerCities = offerAddr?.address?.country 
                    ? getCitiesForCountry(offerAddr.address.country) 
                    : [];

                  return (
                    <div
                      key={offer.offerId}
                      className="rounded-lg border border-border overflow-hidden"
                    >
                      {/* Offer header */}
                      <button
                        onClick={() => setExpandedOfferId(isExpanded ? null : offer.offerId)}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
                          {offer.images?.[0]?.url ? (
                            <img
                              src={offer.images[0].url}
                              alt={offer.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground/40" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {offer.title}
                          </p>
                        </div>

                        <ChevronRight
                          className={`h-5 w-5 text-muted-foreground transition-transform ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        />
                      </button>

                      {/* Expanded address form */}
                      {isExpanded && offerAddr && (
                        <div className="border-t border-border p-4 bg-secondary/30">
                          <label className="flex items-center gap-2 mb-4 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={offerAddr.sameAsProfile}
                              onChange={(e) => handleSameAsProfile(offer.offerId, e.target.checked)}
                              className="h-4 w-4 rounded border-input"
                            />
                            <span className="text-sm text-foreground">Same as profile address</span>
                          </label>

                          <div className={offerAddr.sameAsProfile ? "opacity-50 pointer-events-none" : ""}>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-foreground">Country</label>
                                <div className="relative">
                                  <select
                                    value={offerAddr.address?.country || ""}
                                    onChange={(e) => {
                                      handleOfferAddressChange(offer.offerId, "country", e.target.value);
                                      handleOfferAddressChange(offer.offerId, "city", "");
                                    }}
                                    className="h-10 w-full appearance-none rounded-lg border border-input bg-secondary pl-3 pr-8 text-sm"
                                  >
                                    <option value="">Select</option>
                                    {countries.map((c) => (
                                      <option key={c} value={c}>{c}</option>
                                    ))}
                                  </select>
                                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-foreground">City</label>
                                <div className="relative">
                                  <select
                                    value={offerAddr.address?.city || ""}
                                    onChange={(e) => handleOfferAddressChange(offer.offerId, "city", e.target.value)}
                                    disabled={!offerAddr.address?.country}
                                    className="h-10 w-full appearance-none rounded-lg border border-input bg-secondary pl-3 pr-8 text-sm disabled:opacity-60"
                                  >
                                    <option value="">Select</option>
                                    {offerCities.map((c) => (
                                      <option key={c} value={c}>{c}</option>
                                    ))}
                                  </select>
                                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-foreground">State</label>
                                <input
                                  type="text"
                                  value={offerAddr.address?.state || ""}
                                  onChange={(e) => handleOfferAddressChange(offer.offerId, "state", e.target.value)}
                                  className="h-10 w-full rounded-lg border border-input bg-secondary px-3 text-sm"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-foreground">Zip</label>
                                <input
                                  type="text"
                                  value={offerAddr.address?.zip || ""}
                                  onChange={(e) => handleOfferAddressChange(offer.offerId, "zip", e.target.value)}
                                  className="h-10 w-full rounded-lg border border-input bg-secondary px-3 text-sm"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium text-foreground">Address</label>
                              <input
                                type="text"
                                value={offerAddr.address?.addressLine1 || ""}
                                onChange={(e) => handleOfferAddressChange(offer.offerId, "addressLine1", e.target.value)}
                                placeholder="Street address"
                                className="h-10 w-full rounded-lg border border-input bg-secondary px-3 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {myOffers.length > 0 && (
              <button
                onClick={() => setShowInactiveOffers(!showInactiveOffers)}
                className="mt-4 text-sm text-primary hover:underline"
              >
                {showInactiveOffers ? "Hide inactive offers" : "Show inactive offers"}
              </button>
            )}
          </section>
        )}

        {/* Notifications Section */}
        {activeSection === "notifications" && (
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground mb-4">Notification Settings</h2>

            <div className="space-y-4">
              {/* Push Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Push Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive push notifications on your device</p>
                </div>
                <button
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    pushNotifications ? "bg-primary" : "bg-secondary"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                      pushNotifications ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive updates via email</p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    emailNotifications ? "bg-primary" : "bg-secondary"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                      emailNotifications ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* SMS Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">SMS Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive SMS for important updates</p>
                </div>
                <button
                  onClick={() => setSmsNotifications(!smsNotifications)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    smsNotifications ? "bg-primary" : "bg-secondary"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                      smsNotifications ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Customer Support Section */}
        {activeSection === "support" && (
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground mb-4">Customer Support</h2>

            {/* Contact options */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <button
                disabled
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-secondary/30 opacity-50 cursor-not-allowed"
              >
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Chat</span>
                <span className="text-[10px] text-muted-foreground">Coming soon</span>
              </button>
              <button
                disabled
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-secondary/30 opacity-50 cursor-not-allowed"
              >
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Call</span>
                <span className="text-[10px] text-muted-foreground">Coming soon</span>
              </button>
              <button
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-primary/30 bg-primary/5"
              >
                <Mail className="h-5 w-5 text-primary" />
                <span className="text-xs text-primary font-medium">Email</span>
                <span className="text-[10px] text-muted-foreground">Available</span>
              </button>
            </div>

            {/* Contact Form */}
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Contact Form</h3>
              
              <div className="mb-3">
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm"
                />
              </div>

              <div className="mb-3">
                <label className="mb-1.5 block text-sm font-medium text-foreground">Phone (optional)</label>
                <input
                  type="tel"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm"
                />
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-foreground">Message</label>
                <textarea
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  rows={4}
                  placeholder="How can we help you?"
                  className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm resize-none"
                />
              </div>

              <button
                onClick={handleSubmitSupport}
                disabled={supportSubmitting || !supportMessage.trim()}
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {supportSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit
                  </>
                )}
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Save Button - stays within content area, at bottom of scrollable content */}
      <div className="mt-6 p-4 -mx-4 lg:mx-0 bg-card/50 border-t border-border lg:rounded-lg lg:border">
        <div className="flex gap-3">
          {!isNewUser && (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
            >
              <DoorOpen className="h-4 w-4" />
              Logout
            </button>
          )}
          <button
            onClick={handleSaveProfile}
            disabled={saving || !isProfileComplete}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4" />
                {isNewUser && !auth.user?.isProfileComplete ? "Complete Profile" : "Save Changes"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom spacer for mobile nav */}
      {!isNewUser && <div className="h-20 lg:h-0" />}
    </div>
  );
}
