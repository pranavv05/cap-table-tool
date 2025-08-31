import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { 
  createFundingRoundSchema, 
  safeTermsSchema,
  validateData,
  validateMonetaryAmount,
  type ValidationResult
} from "@/lib/validation"
import { z } from "zod"

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
    const validation = validateData(createFundingRoundSchema, body)
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

    const validatedData = validation.data

    const supabase = await createClient()

    // Set the current user context for RLS
    await supabase.rpc("set_config", {
      setting_name: "app.current_user_id",
      setting_value: userId,
      is_local: true,
    })

    // Verify user owns the company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, authorized_shares")
      .eq("id", validatedData.company_id)
      .eq("clerk_user_id", userId)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { 
          error: "Company not found or unauthorized", 
          code: "COMPANY_NOT_FOUND" 
        }, 
        { status: 404 }
      )
    }

    // Additional business logic validation
    if (validatedData.shares_issued && validatedData.shares_issued > company.authorized_shares) {
      return NextResponse.json(
        {
          error: "Shares issued cannot exceed authorized shares",
          code: "SHARES_EXCEEDED",
          details: {
            shares_issued: validatedData.shares_issued,
            authorized_shares: company.authorized_shares
          }
        },
        { status: 400 }
      )
    }

    // Validate SAFE-specific terms if this is a SAFE round
    if (validatedData.round_type === "safe") {
      const safeData = {
        valuation_cap: (body as any).valuationCap,
        discount_rate: (body as any).discountRate,
        most_favored_nation: (body as any).mostFavoredNation || false
      }
      
      const safeValidation = validateData(safeTermsSchema, safeData)
      if (!safeValidation.success) {
        return NextResponse.json(
          { 
            error: "Invalid SAFE terms", 
            code: "SAFE_VALIDATION_ERROR",
            details: safeValidation.error.errors
          },
          { status: 400 }
        )
      }
    }

    // Check for duplicate round names within the company
    const { data: existingRound, error: duplicateError } = await supabase
      .from("funding_rounds")
      .select("id")
      .eq("company_id", validatedData.company_id)
      .eq("round_name", validatedData.round_name)
      .limit(1)

    if (duplicateError) {
      console.error("Database error during duplicate check:", duplicateError)
    } else if (existingRound && existingRound.length > 0) {
      return NextResponse.json(
        {
          error: "Round name already exists for this company",
          code: "DUPLICATE_ROUND_NAME"
        },
        { status: 409 }
      )
    }

    // Insert funding round data
    const { data: fundingRound, error } = await supabase
      .from("funding_rounds")
      .insert({
        company_id: validatedData.company_id,
        round_name: validatedData.round_name,
        round_type: validatedData.round_type,
        total_investment: validatedData.total_investment,
        pre_money_valuation: validatedData.pre_money_valuation,
        post_money_valuation: validatedData.post_money_valuation,
        price_per_share: validatedData.price_per_share,
        shares_issued: validatedData.shares_issued,
        closing_date: validatedData.closing_date,
        lead_investor: validatedData.lead_investor,
        liquidation_preference: validatedData.liquidation_preference,
        participation_rights: validatedData.participation_rights,
        anti_dilution_rights: validatedData.anti_dilution_rights,
        dividend_rate: validatedData.dividend_rate,
        voting_rights: validatedData.voting_rights,
        board_seats: validatedData.board_seats,
        pro_rata_rights: validatedData.pro_rata_rights,
        drag_along_rights: validatedData.drag_along_rights,
        tag_along_rights: validatedData.tag_along_rights,
        is_completed: validatedData.is_completed,
        notes: validatedData.notes,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error during funding round creation:", error)
      
      // Handle specific database errors
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          {
            error: "Funding round with these details already exists",
            code: "DUPLICATE_FUNDING_ROUND"
          },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { 
          error: "Failed to create funding round", 
          code: "DATABASE_ERROR",
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, 
        { status: 500 }
      )
    }

    // Log successful creation for audit purposes
    console.log(`Funding round created successfully: ${fundingRound.id} by user ${userId}`)

    return NextResponse.json(
      { 
        success: true,
        data: { fundingRound },
        message: "Funding round created successfully"
      }, 
      { status: 201 }
    )
  } catch (error) {
    console.error("Unexpected error in POST /api/funding-rounds:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")

    if (!companyId) {
      return NextResponse.json({ error: "Company ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Set the current user context for RLS
    await supabase.rpc("set_config", {
      setting_name: "app.current_user_id",
      setting_value: userId,
      is_local: true,
    })

    const { data: fundingRounds, error } = await supabase
      .from("funding_rounds")
      .select("*")
      .eq("company_id", companyId)
      .order("closing_date", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch funding rounds" }, { status: 500 })
    }

    return NextResponse.json({ fundingRounds })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
