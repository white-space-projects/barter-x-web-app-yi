/**
 * App Access Control API
 * GET: Fetch current access control settings (public - used by login page)
 * PUT: Update access control settings (admin only)
 */

import { NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";

interface AccessControl {
  id: string;
  allow_ff: boolean;
  allow_beta: boolean;
  allow_all: boolean;
  updated_at: string;
}

// GET - Fetch current access control (public endpoint)
export async function GET() {
  try {
    const result = await query<AccessControl>(
      `SELECT id, allow_ff, allow_beta, allow_all, updated_at 
       FROM application.app_access_control 
       LIMIT 1`
    );

    if (result.length === 0) {
      // Return default config if none exists
      return NextResponse.json({
        allowFf: true,
        allowBeta: false,
        allowAll: false,
        updatedAt: new Date().toISOString(),
      });
    }

    const config = result[0];
    return NextResponse.json({
      allowFf: config.allow_ff,
      allowBeta: config.allow_beta,
      allowAll: config.allow_all,
      updatedAt: config.updated_at,
    });
  } catch (error) {
    console.error("Error fetching access control:", error);
    return NextResponse.json(
      { error: "Failed to fetch access control" },
      { status: 500 }
    );
  }
}

// PUT - Update access control (admin only)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { allowFf, allowBeta, allowAll, updatedBy } = body;

    // Validate input
    if (typeof allowFf !== "boolean" || typeof allowBeta !== "boolean" || typeof allowAll !== "boolean") {
      return NextResponse.json(
        { error: "Invalid input: allowFf, allowBeta, allowAll must be booleans" },
        { status: 400 }
      );
    }

    // Check if config exists
    const existing = await query<{ id: string }>(
      `SELECT id FROM application.app_access_control LIMIT 1`
    );

    let result: AccessControl[];

    if (existing.length === 0) {
      // Insert new config
      result = await query<AccessControl>(
        `INSERT INTO application.app_access_control (allow_ff, allow_beta, allow_all, updated_by, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING id, allow_ff, allow_beta, allow_all, updated_at`,
        [allowFf, allowBeta, allowAll, updatedBy || null]
      );
    } else {
      // Update existing config
      result = await query<AccessControl>(
        `UPDATE application.app_access_control 
         SET allow_ff = $1, allow_beta = $2, allow_all = $3, updated_by = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING id, allow_ff, allow_beta, allow_all, updated_at`,
        [allowFf, allowBeta, allowAll, updatedBy || null, existing[0].id]
      );
    }

    const config = result[0];
    return NextResponse.json({
      allowFf: config.allow_ff,
      allowBeta: config.allow_beta,
      allowAll: config.allow_all,
      updatedAt: config.updated_at,
    });
  } catch (error) {
    console.error("Error updating access control:", error);
    return NextResponse.json(
      { error: "Failed to update access control" },
      { status: 500 }
    );
  }
}
