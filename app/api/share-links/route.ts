import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { randomBytes } from "crypto"

// Validation schema for creating share links
const createShareLinkSchema = z.object({
  scenarioId: z.string().uuid("Invalid scenario ID format"),
  permissions: z.object({
    canView: z.boolean(),
    canComment: z.boolean().optional().default(false),
    canEdit: z.boolean().optional().default(false),
    requiresAuth: z.boolean().optional().default(true),
  }),
  expiresAt: z.coerce.date(),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" }, 
        { status: 401 }
      )
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON payload", code: "INVALID_JSON" },
        { status: 400 }
      )
    }

    // Validate the request data
    const validation = createShareLinkSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          code: "VALIDATION_ERROR",
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { scenarioId, permissions, expiresAt } = validation.data

    const supabase = await createClient()

    // Set the current user context for RLS
    await supabase.rpc("set_config", {
      setting_name: "app.current_user_id",
      setting_value: userId,
      is_local: true,
    })

    // Verify user owns the scenario
    const { data: scenario, error: scenarioError } = await supabase
      .from("scenarios")
      .select(`
        id,
        company_id,
        companies!inner(
          id,
          clerk_user_id
        )
      `)
      .eq("id", scenarioId)
      .eq("companies.clerk_user_id", userId)
      .single()

    if (scenarioError || !scenario) {
      return NextResponse.json(
        { 
          error: "Scenario not found or unauthorized", 
          code: "SCENARIO_NOT_FOUND" 
        }, 
        { status: 404 }
      )
    }

    // Generate secure share token
    const shareToken = randomBytes(32).toString("hex")

    // Create share link record
    const { data: shareLink, error: createError } = await supabase
      .from("share_links")
      .insert({
        share_token: shareToken,
        scenario_id: scenarioId,
        created_by_user_id: userId,
        permissions: permissions,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })
      .select("share_token")
      .single()

    if (createError) {
      console.error("Failed to create share link:", createError)
      return NextResponse.json(
        { 
          error: "Failed to create share link", 
          code: "DATABASE_ERROR" 
        }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      shareToken: shareLink.share_token,
      expiresAt: expiresAt.toISOString(),
      permissions 
    })

  } catch (error) {
    console.error("Unexpected error in share-links API:", error)
    return NextResponse.json(
      { 
        error: "Internal server error", 
        code: "INTERNAL_ERROR" 
      }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const scenarioId = searchParams.get("scenarioId")

    if (!scenarioId) {
      return NextResponse.json(
        { error: "Scenario ID required", code: "MISSING_SCENARIO_ID" }, 
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Set the current user context for RLS
    await supabase.rpc("set_config", {
      setting_name: "app.current_user_id",
      setting_value: userId,
      is_local: true,
    })

    // Get existing share links for the scenario
    const { data: shareLinks, error } = await supabase
      .from("share_links")
      .select(`
        id,
        share_token,
        permissions,
        expires_at,
        is_active,
        created_at,
        access_count
      `)
      .eq("scenario_id", scenarioId)
      .eq("created_by_user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch share links:", error)
      return NextResponse.json(
        { 
          error: "Failed to fetch share links", 
          code: "DATABASE_ERROR" 
        }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ shareLinks })

  } catch (error) {
    console.error("Unexpected error in share-links GET:", error)
    return NextResponse.json(
      { 
        error: "Internal server error", 
        code: "INTERNAL_ERROR" 
      }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const shareToken = searchParams.get("shareToken")

    if (!shareToken) {
      return NextResponse.json(
        { error: "Share token required", code: "MISSING_SHARE_TOKEN" }, 
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Set the current user context for RLS
    await supabase.rpc("set_config", {
      setting_name: "app.current_user_id",
      setting_value: userId,
      is_local: true,
    })

    // Deactivate the share link (soft delete)
    const { error } = await supabase
      .from("share_links")
      .update({ is_active: false })
      .eq("share_token", shareToken)
      .eq("created_by_user_id", userId)

    if (error) {
      console.error("Failed to delete share link:", error)
      return NextResponse.json(
        { 
          error: "Failed to delete share link", 
          code: "DATABASE_ERROR" 
        }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Unexpected error in share-links DELETE:", error)
    return NextResponse.json(
      { 
        error: "Internal server error", 
        code: "INTERNAL_ERROR" 
      }, 
      { status: 500 }
    )
  }
}