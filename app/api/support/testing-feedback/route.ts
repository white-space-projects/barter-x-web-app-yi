import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      userEmail, 
      feedbackType, 
      screenArea, 
      featureFlow, 
      message,
      hasAttachments,
      attachmentCount
    } = body;

    // Validate required fields
    if (!feedbackType || !message) {
      return NextResponse.json(
        { error: "Missing required fields: feedbackType, message" },
        { status: 400 }
      );
    }

    // Map feedback type to readable label
    const feedbackTypeLabels: Record<string, string> = {
      bug: "Bug / Issue",
      ux: "UX Improvement",
      ui: "UI / Design Suggestion",
      feature: "Feature Idea",
      general: "General Feedback",
    };

    // Build description with structured metadata
    const description = `
**Feedback Type:** ${feedbackTypeLabels[feedbackType] || feedbackType}
${screenArea ? `**Screen/Area:** ${screenArea}` : ""}
${featureFlow ? `**Feature/Flow:** ${featureFlow}` : ""}

---

${message}

---
**Metadata:**
- User ID: ${userId || "N/A"}
- User Email: ${userEmail || "N/A"}
- Has Attachments: ${hasAttachments ? `Yes (${attachmentCount} images)` : "No"}
- Testing Phase: F&F Beta
- Submitted At: ${new Date().toISOString()}
`.trim();

    // Build subject line
    const subjectParts = [
      `[${feedbackTypeLabels[feedbackType] || feedbackType}]`,
      screenArea ? `${screenArea}` : "",
      message.slice(0, 50) + (message.length > 50 ? "..." : ""),
    ].filter(Boolean);
    const subject = subjectParts.join(" - ");

    // Map feedback type to priority
    const priorityMap: Record<string, string> = {
      bug: "high",
      ux: "medium",
      ui: "medium",
      feature: "low",
      general: "low",
    };

    // Insert into tickets table
    const result = await query<{ ticket_id: string }>(
      `INSERT INTO application.tickets (
        user_id,
        subject,
        description,
        status,
        priority,
        category,
        created_at,
        updated_at
      ) VALUES (
        $1,
        $2,
        $3,
        'open',
        $4,
        'testing_feedback',
        NOW(),
        NOW()
      )
      RETURNING ticket_id`,
      [
        userId || null,
        subject,
        description,
        priorityMap[feedbackType] || "medium",
      ]
    );

    return NextResponse.json({ 
      success: true, 
      ticketId: result[0]?.ticket_id 
    }, { status: 201 });

  } catch (error) {
    console.error("[API] Testing feedback error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
