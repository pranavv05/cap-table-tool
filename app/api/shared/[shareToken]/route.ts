import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    const { shareToken } = params

    if (!shareToken) {
      return NextResponse.json(
        { error: "Share token required", code: "MISSING_SHARE_TOKEN" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // First, check if the share link exists and is valid
    const { data: shareLink, error: shareLinkError } = await supabase
      .from("share_links")
      .select(`
        id,
        scenario_id,
        permissions,
        expires_at,
        is_active,
        access_count,
        created_by_user_id
      `)
      .eq("share_token", shareToken)
      .single()

    if (shareLinkError || !shareLink) {
      return NextResponse.json(
        { error: "Share link not found", code: "SHARE_LINK_NOT_FOUND" },
        { status: 404 }
      )
    }

    // Check if the link is active
    if (!shareLink.is_active) {
      return NextResponse.json(
        { error: "Share link has been deactivated", code: "SHARE_LINK_INACTIVE" },
        { status: 410 }
      )
    }

    // Check if the link has expired
    const now = new Date()
    const expiresAt = new Date(shareLink.expires_at)
    if (expiresAt < now) {
      return NextResponse.json(
        { error: "Share link has expired", code: "SHARE_LINK_EXPIRED" },
        { status: 410 }
      )
    }

    // Check authentication requirement
    const { userId } = await auth()
    if (shareLink.permissions.requiresAuth && !userId) {
      return NextResponse.json(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      )
    }

    // Fetch the scenario and company data
    const { data: scenarioData, error: scenarioError } = await supabase
      .from("scenarios")
      .select(`
        id,
        scenario_name,
        scenario_type,
        description,
        exit_valuation,
        created_at,
        company_id,
        companies!inner(
          id,
          name
        )
      `)
      .eq("id", shareLink.scenario_id)
      .single()

    if (scenarioError || !scenarioData) {
      return NextResponse.json(
        { error: "Scenario not found", code: "SCENARIO_NOT_FOUND" },
        { status: 404 }
      )
    }

    // Increment access count
    await supabase.rpc("increment_share_link_access", {
      token_param: shareToken
    })

    // Return the scenario data with share link info
    return NextResponse.json({
      scenario: {
        id: scenarioData.id,
        scenario_name: scenarioData.scenario_name,
        scenario_type: scenarioData.scenario_type,
        description: scenarioData.description,
        exit_valuation: scenarioData.exit_valuation,
        created_at: scenarioData.created_at,
      },
      shareLink: {
        permissions: shareLink.permissions,
        expires_at: shareLink.expires_at,
        access_count: shareLink.access_count + 1, // Include the current access
      },
      company: {
        name: scenarioData.companies.name,
      },
    })

  } catch (error) {
    console.error("Unexpected error in shared scenario API:", error)
    return NextResponse.json(
      { 
        error: "Internal server error", 
        code: "INTERNAL_ERROR" 
      }, 
      { status: 500 }
    )
  }
}