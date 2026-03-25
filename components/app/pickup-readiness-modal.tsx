"use client";

import { useState, useMemo, useEffect } from "react";
import { X, Loader2, CheckCircle2, Phone } from "lucide-react";
import { useBarterStore } from "@/lib/store";
import { toast } from "sonner";
import { COUNTRIES_DATA, getCitiesForCountry } from "@/lib/countries-data";

type Props = {
  offerId: string;
  onClose: () => void;
};

type ModalStep = "form" | "otp" | "escrow";

// Generate next 7 days for dropdown
function getNext7Days(): { value: string; label: string }[] {
  const days: { value: string; label: string }[] = [];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const dayName = dayNames[date.getDay()];
    
    days.push({
      value: `${day}/${month}/${year}`,
      label: `${day}-${month}-${year}, ${dayName}`,
    });
  }
  
  return days;
}

export function PickupReadinessModal({ offerId, onClose }: Props) {
  const { updateOffer, getOfferById, getHooksByFromOffer, updateHook, addNotification, hooks } = useBarterStore();
  const offer = getOfferById(offerId);

  // Pre-populate from offer's existing pickupAddress
  const existingAddress = offer?.pickupAddress;
  const { auth } = useBarterStore();

  const [modalStep, setModalStep] = useState<ModalStep>("form");
  
  // Address fields - pre-populated from offer
  const [country, setCountry] = useState(existingAddress?.country || "");
  const [city, setCity] = useState(existingAddress?.city || "");
  const [state, setState] = useState(existingAddress?.state || "");
  const [zip, setZip] = useState(existingAddress?.zip || "");
  const [addressLine1, setAddressLine1] = useState(existingAddress?.addressLine1 || "");
  const [addressLine2, setAddressLine2] = useState(existingAddress?.addressLine2 || "");
  
  // Phone verification - required for pickup
  const [phoneNumber, setPhoneNumber] = useState(existingAddress?.phone || auth.user?.phone || "");
  const [phoneVerified, setPhoneVerified] = useState(existingAddress?.phoneVerified || false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  
  // Date selection
  const [pickupDate, setPickupDate] = useState(offer?.pickupReadyDate || "");
  const [loading, setLoading] = useState(false);
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const next7Days = useMemo(() => getNext7Days(), []);
  const availableCities = useMemo(() => getCitiesForCountry(country), [country]);

  // Re-populate fields when offer changes (for edit mode)
  useEffect(() => {
    if (existingAddress) {
      setCountry(existingAddress.country || "");
      setCity(existingAddress.city || "");
      setState(existingAddress.state || "");
      setZip(existingAddress.zip || "");
      setAddressLine1(existingAddress.addressLine1 || "");
      setAddressLine2(existingAddress.addressLine2 || "");
    }
    if (offer?.pickupReadyDate) {
      setPickupDate(offer.pickupReadyDate);
    }
  }, [existingAddress, offer?.pickupReadyDate]);

  if (!offer) return null;

  const isUpdate = offer.readyForCommit;
  const serviceCharge = 1; // Fixed platform service charge
  const securityDeposit = 500; // Security deposit - only charged if user fails to provide their offer

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};
    
    if (!country) newErrors.country = "Country is required";
    if (!city) newErrors.city = "City is required";
    if (!zip) newErrors.zip = "Zip is required";
    if (!state) newErrors.state = "State is required";
    if (!addressLine1) newErrors.addressLine1 = "Address line 1 is required";
    if (!pickupDate) newErrors.pickupDate = "Please select a pickup date";
    if (!phoneNumber) newErrors.phone = "Phone number is required for verification";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Send OTP to phone number
  async function handleSendOtp() {
    if (!phoneNumber) {
      setOtpError("Please enter a phone number");
      return;
    }
    
    setOtpLoading(true);
    setOtpError("");
    
    // Simulate API call to send OTP
    await new Promise((r) => setTimeout(r, 1000));
    
    setOtpSent(true);
    setOtpLoading(false);
    toast.success(`OTP sent to ${phoneNumber}`);
  }

  // Verify OTP
  async function handleVerifyOtp() {
    if (!otpCode || otpCode.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP");
      return;
    }
    
    setOtpLoading(true);
    setOtpError("");
    
    // Simulate OTP verification (accept any 6-digit code for demo)
    await new Promise((r) => setTimeout(r, 800));
    
    // For demo: accept any 6-digit code
    setPhoneVerified(true);
    setOtpLoading(false);
    toast.success("Phone number verified successfully");
    setModalStep("escrow");
  }

  function handleProceedToVerification() {
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // If phone already verified or updating, go to escrow
    if (phoneVerified || isUpdate) {
      if (isUpdate) {
        handleUpdateDetails();
      } else {
        setModalStep("escrow");
      }
    } else {
      // Need phone verification
      setModalStep("otp");
    }
  }

  // Update details without escrow (for already confirmed offers)
  async function handleUpdateDetails() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    // Update the offer with new address, date, and phone
    updateOffer(offerId, {
      pickupAddress: {
        country,
        city,
        state,
        zip,
        addressLine1,
        addressLine2,
        phone: phoneNumber,
        phoneVerified,
      },
      pickupReadyDate: pickupDate,
    });

    setLoading(false);
    toast.success("Pickup details updated successfully.");
    onClose();
  }

  async function handleConfirmEscrow() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));

    // Find hooks that target this offer (inbound hooks from other users)
    const inboundHooks = hooks.filter((h) => h.toOfferId === offerId);

    // Update all reserved hooks for this offer to "processing" (Committed)
    const outboundHooks = getHooksByFromOffer(offerId);
    outboundHooks.forEach((hook) => {
      if (hook.status === "reserved") {
        updateHook(hook.hookId, { status: "processing" });
      }
    });

    // Update the offer with address, selected date, and verified phone
    updateOffer(offerId, {
      readyForCommit: true,
      pickupAddress: {
        country,
        city,
        state,
        zip,
        addressLine1,
        addressLine2,
        phone: phoneNumber,
        phoneVerified: true,
      },
      escrowAmount: serviceCharge + securityDeposit,
      pickupReadyDate: pickupDate,
    });

    // Generate notifications for users who hooked this offer
    inboundHooks.forEach((hook) => {
      if (hook.status === "reserved" || hook.status === "processing") {
        addNotification({
          type: "pickup_confirm",
          hookId: hook.hookId,
          offerId: hook.fromOfferId,
          title: "Pickup Confirmed",
          message: `The owner of "${offer.title}" has confirmed pickup readiness for ${pickupDate}. You can now chat and view the pickup address.`,
          actionType: "view_chat",
          actionLabel: "Open Chat",
        });
      }
    });

    setLoading(false);
    toast.success(
      isUpdate 
        ? "Pickup details updated successfully."
        : "Your offer is ready. We'll notify you when the trade is confirmed."
    );
    onClose();
  }

  // Handle country change - reset city when country changes
  function handleCountryChange(newCountry: string) {
    setCountry(newCountry);
    if (newCountry !== country) {
      setCity("");
    }
    setErrors((prev) => ({ ...prev, country: "" }));
  }

  return (
    <>
      <div
        className="fixed inset-0 lg:left-56 z-[60] bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal - wider on desktop with better layout */}
      <div className="fixed z-[70] inset-4 lg:inset-auto lg:left-[calc(50%+7rem)] lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-lg rounded-xl border border-border bg-card shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <h3 className="text-base font-semibold text-foreground">
            {modalStep === "form"
              ? isUpdate ? "Update pickup details" : "Confirm pickup readiness"
              : modalStep === "otp"
              ? "Phone verification"
              : "Escrow preview"}
          </h3>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {modalStep === "form" ? (
            <div>
              <p className="mb-4 text-xs text-muted-foreground">
                {isUpdate 
                  ? <>Update pickup details for <span className="text-foreground font-medium">&quot;{offer.title}&quot;</span>.</>
                  : <>Confirm when and where your offer <span className="text-foreground font-medium">&quot;{offer.title}&quot;</span> can be picked up.</>
                }
              </p>

              {/* Pickup date selection */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Pickup date <span className="text-destructive">*</span>
                </label>
                <p className="mb-2 text-xs text-muted-foreground">
                  Select any pickup date within the next 7 days, sooner the fulfilment is better for committing the exchanges.
                </p>
                <select
                  value={pickupDate}
                  onChange={(e) => {
                    setPickupDate(e.target.value);
                    setErrors((prev) => ({ ...prev, pickupDate: "" }));
                  }}
                  className={`h-10 w-full rounded-lg border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.pickupDate ? "border-destructive" : "border-input"
                  }`}
                >
                  <option value="">Select a date</option>
                  {next7Days.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
                {errors.pickupDate && (
                  <p className="mt-1 text-xs text-destructive">{errors.pickupDate}</p>
                )}
              </div>

              {/* Address fields */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Pickup address
                </label>
                <p className="mb-2 text-xs text-muted-foreground italic">
                  Dummy address can be entered for Testing.
                </p>
                
                <div className="flex flex-col gap-3">
                  {/* Country dropdown */}
                  <div>
                    <select
                      value={country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className={`h-10 w-full rounded-lg border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                        errors.country ? "border-destructive" : "border-input"
                      }`}
                    >
                      <option value="">Select country *</option>
                      {COUNTRIES_DATA.map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.country && (
                      <p className="mt-1 text-xs text-destructive">{errors.country}</p>
                    )}
                  </div>

                  {/* City dropdown */}
                  <div>
                    <select
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        setErrors((prev) => ({ ...prev, city: "" }));
                      }}
                      disabled={!country}
                      className={`h-10 w-full rounded-lg border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors.city ? "border-destructive" : "border-input"
                      }`}
                    >
                      <option value="">Select city *</option>
                      {availableCities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.city && (
                      <p className="mt-1 text-xs text-destructive">{errors.city}</p>
                    )}
                  </div>

                  {/* State & Zip */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => {
                          setState(e.target.value);
                          setErrors((prev) => ({ ...prev, state: "" }));
                        }}
                        placeholder="State *"
                        className={`h-10 w-full rounded-lg border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                          errors.state ? "border-destructive" : "border-input"
                        }`}
                      />
                      {errors.state && (
                        <p className="mt-1 text-xs text-destructive">{errors.state}</p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={zip}
                        onChange={(e) => {
                          setZip(e.target.value);
                          setErrors((prev) => ({ ...prev, zip: "" }));
                        }}
                        placeholder="Zip *"
                        className={`h-10 w-full rounded-lg border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                          errors.zip ? "border-destructive" : "border-input"
                        }`}
                      />
                      {errors.zip && (
                        <p className="mt-1 text-xs text-destructive">{errors.zip}</p>
                      )}
                    </div>
                  </div>

                  {/* Address line 1 */}
                  <div>
                    <input
                      type="text"
                      value={addressLine1}
                      onChange={(e) => {
                        setAddressLine1(e.target.value);
                        setErrors((prev) => ({ ...prev, addressLine1: "" }));
                      }}
                      placeholder="Address line 1 *"
                      className={`h-10 w-full rounded-lg border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                        errors.addressLine1 ? "border-destructive" : "border-input"
                      }`}
                    />
                    {errors.addressLine1 && (
                      <p className="mt-1 text-xs text-destructive">{errors.addressLine1}</p>
                    )}
                  </div>

{/* Address line 2 (optional) */}
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Address line 2 (optional)"
                    className="h-10 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Phone number for verification */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Phone number <span className="text-destructive">*</span>
                </label>
                <p className="mb-2 text-xs text-muted-foreground">
                  Required for pickup/delivery verification. You will receive an OTP to verify.
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        setPhoneVerified(false); // Reset verification if phone changes
                        setErrors((prev) => ({ ...prev, phone: "" }));
                      }}
                      placeholder="+1 234 567 8900"
                      className={`h-10 w-full rounded-lg border bg-secondary pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                        errors.phone ? "border-destructive" : "border-input"
                      }`}
                    />
                  </div>
                  {phoneVerified && (
                    <div className="flex items-center gap-1.5 px-3 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Verified
                    </div>
                  )}
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-destructive">{errors.phone}</p>
                )}
              </div>

              <button
                onClick={handleProceedToVerification}
                disabled={loading}
                className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isUpdate ? (
                  "Update details"
                ) : phoneVerified ? (
                  "Proceed to escrow"
                ) : (
                  "Verify phone & proceed"
                )}
              </button>
            </div>
          ) : modalStep === "otp" ? (
            /* OTP Verification step */
            <div>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Phone className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Verify Your Phone</h3>
                <p className="text-sm text-muted-foreground">
                  We need to verify your phone number for pickup/delivery confirmation.
                </p>
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setOtpSent(false);
                      setOtpCode("");
                    }}
                    placeholder="+1 234 567 8900"
                    className="h-10 flex-1 rounded-lg border border-input bg-secondary px-3 text-sm text-foreground"
                  />
                  <button
                    onClick={handleSendOtp}
                    disabled={otpLoading || !phoneNumber}
                    className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
                  >
                    {otpLoading && !otpSent ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : otpSent ? (
                      "Resend"
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                </div>
              </div>

              {otpSent && (
                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Enter 6-digit OTP
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtpCode(val);
                      setOtpError("");
                    }}
                    placeholder="000000"
                    maxLength={6}
                    className="h-10 w-full rounded-lg border border-input bg-secondary px-3 text-center text-lg font-mono tracking-widest text-foreground"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground text-center">
                    OTP sent to {phoneNumber}
                  </p>
                </div>
              )}

              {otpError && (
                <p className="mb-4 text-sm text-destructive text-center">{otpError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setModalStep("form")}
                  className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOtp}
                  disabled={otpLoading || !otpSent || otpCode.length !== 6}
                  className="flex flex-1 items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {otpLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verify & Continue"
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Escrow preview */
            <div>
              <p className="mb-5 text-sm text-muted-foreground leading-relaxed">
                Review the escrow charges below. This amount will be blocked
                until the trade is fully committed.
              </p>

              <div className="rounded-lg border border-border bg-secondary/30 p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Barter-X platform service charge
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {"\u20AC"}{serviceCharge}.00
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Security deposit (refundable)
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {"\u20AC"}{securityDeposit}.00
                  </span>
                </div>
                <div className="border-t border-border pt-2 mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    Total blocked
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {"\u20AC"}{serviceCharge + securityDeposit}.00
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 mb-4">
                <p className="text-xs text-foreground leading-relaxed">
                  <span className="font-semibold">{"\u20AC"}{securityDeposit}</span> will be temporarily blocked and only charged if you collect the hooked offer but fail to provide your offer. This ensures fairness for everyone in the trade chain.
                </p>
              </div>

              <p className="mb-5 text-xs text-muted-foreground leading-relaxed">
                After confirming, you can chat with the other user to discuss pickup details. 
                If needed, you can request pickup &amp; delivery support ({"\u20AC"}10) from the Chat tab.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setModalStep("form")}
                  className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmEscrow}
                  disabled={loading}
                  className="flex flex-1 items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Confirm escrow"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
