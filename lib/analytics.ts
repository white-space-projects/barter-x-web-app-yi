import { query } from "@/lib/db";

export type LoginAnalyticsEvent =
  | "login_page_view"
  | "login_email_submitted"
  | "login_otp_sent"
  | "login_otp_verified"
  | "login_otp_failed"
  | "login_otp_resent"
  | "login_location_detected"
  | "login_location_changed"
  | "login_issue_reported"
  | "login_completed"
  | "login_failed";

export interface AnalyticsEventData {
  eventName: string;
  eventCategory?: string;
  screenName?: string;
  componentName?: string;
  actionSource?: string;
  userId?: string | null;
  sessionId?: string | null;
  correlationId?: string | null;
  platform?: string;
  countryId?: string | null;
  cityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  deviceInfo?: Record<string, unknown>;
  browserInfo?: Record<string, unknown>;
}

/**
 * Log an analytics event to the database
 */
export async function logAnalyticsEvent(data: AnalyticsEventData): Promise<void> {
  try {
    await query(
      `INSERT INTO analytics.events (
        event_name, event_category, screen_name, component_name, action_source,
        user_id, session_id, correlation_id, platform,
        event_country_id, event_city_id, metadata,
        ip_address, device_info, browser_info
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13::inet, $14::jsonb, $15::jsonb
      )`,
      [
        data.eventName,
        data.eventCategory || "login",
        data.screenName || "login",
        data.componentName || null,
        data.actionSource || null,
        data.userId || null,
        data.sessionId || null,
        data.correlationId || null,
        data.platform || "web",
        data.countryId || null,
        data.cityId || null,
        JSON.stringify(data.metadata || {}),
        data.ipAddress || null,
        JSON.stringify(data.deviceInfo || {}),
        JSON.stringify(data.browserInfo || {}),
      ]
    );
  } catch (error) {
    // Don't throw - analytics should not break the main flow
    console.error("[v0] Analytics event failed:", error);
  }
}

/**
 * Log a login flow event
 */
export async function logLoginEvent(
  eventName: LoginAnalyticsEvent,
  data: {
    email?: string;
    userId?: string | null;
    countryId?: string | null;
    cityId?: string | null;
    detectedCountryId?: string | null;
    detectedCityId?: string | null;
    errorType?: string;
    errorMessage?: string;
    step?: string;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<void> {
  await logAnalyticsEvent({
    eventName,
    eventCategory: "login",
    screenName: "login",
    userId: data.userId,
    countryId: data.countryId,
    cityId: data.cityId,
    metadata: {
      email: data.email ? `${data.email.substring(0, 3)}***` : undefined, // Mask email for privacy
      detectedCountryId: data.detectedCountryId,
      detectedCityId: data.detectedCityId,
      errorType: data.errorType,
      errorMessage: data.errorMessage,
      step: data.step,
      ...data.metadata,
    },
  });
}
