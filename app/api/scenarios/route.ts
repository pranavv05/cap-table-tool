import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { 
  createScenarioSchema, 
  companyQuerySchema,
  validateData,
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
    const validation = validateData(createScenarioSchema, body)
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
      .select("id")
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

    // Check for duplicate scenario names within the company
    const { data: existingScenario, error: duplicateError } = await supabase
      .from("scenarios")
      .select("id")
      .eq("company_id", validatedData.company_id)
      .eq("name", validatedData.name)
      .limit(1)

    if (duplicateError) {
      console.error("Database error during duplicate check:", duplicateError)
    } else if (existingScenario && existingScenario.length > 0) {
      return NextResponse.json(
        {
          error: "Scenario name already exists for this company",
          code: "DUPLICATE_SCENARIO_NAME"
        },
        { status: 409 }
      )
    }

    // If setting as baseline, unset other baselines first
    if (validatedData.is_baseline) {
      const { error: baselineError } = await supabase
        .from("scenarios")
        .update({ is_baseline: false })
        .eq("company_id", validatedData.company_id)
        .eq("is_baseline", true)
      
      if (baselineError) {
        console.error("Error updating baseline scenarios:", baselineError)
      }
    }

    // Insert scenario data
    const { data: scenario, error } = await supabase
      .from("scenarios")
      .insert({
        company_id: validatedData.company_id,
        name: validatedData.name,
        scenario_type: validatedData.scenario_type,
        description: validatedData.description || null,
        exit_valuation: validatedData.exit_valuation,
        liquidation_preference_multiple: validatedData.liquidation_preference_multiple,
        participation_cap: validatedData.participation_cap,
        new_investment_amount: validatedData.new_investment_amount,
        new_pre_money_valuation: validatedData.new_pre_money_valuation,
        new_option_pool_percentage: validatedData.new_option_pool_percentage,
        is_baseline: validatedData.is_baseline,
        assumptions: validatedData.assumptions,
        results: validatedData.results,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error("Database error during scenario creation:", error)
      
      // Handle specific database errors
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          {
            error: "Scenario with these details already exists",
            code: "DUPLICATE_SCENARIO"
          },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        {
          error: "Failed to create scenario",
          code: "DATABASE_ERROR",
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      )
    }

    // Log successful creation for audit purposes
    console.log(`Scenario created successfully: ${scenario.id} by user ${userId}`)

    return NextResponse.json(
      { 
        success: true,
        data: { scenario },
        message: "Scenario created successfully"
      }, 
      { status: 201 }
    )
  } catch (error) {
    console.error("Unexpected error in POST /api/scenarios:", error)
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
      return NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const queryData = {
      company_id: searchParams.get("companyId"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      sort_by: searchParams.get("sortBy"),
      sort_order: searchParams.get("sortOrder")
    }

    // Validate query parameters
    if (!queryData.company_id) {
      return NextResponse.json(
        { error: "Company ID required", code: "MISSING_COMPANY_ID" }, 
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(queryData.company_id)) {
      return NextResponse.json(
        { error: "Invalid company ID format", code: "INVALID_UUID" },
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

    // Verify user owns the company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("id", queryData.company_id)
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

    // Parse pagination parameters with defaults
    const page = Math.max(1, parseInt(queryData.page || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(queryData.limit || '10', 10)))
    const sortBy = queryData.sort_by || 'created_at'
    const sortOrder = (queryData.sort_order === 'asc') ? 'asc' : 'desc'

    // Build query with pagination
    let query = supabase
      .from("scenarios")
      .select("*", { count: 'exact' })
      .eq("company_id", queryData.company_id)
      .order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: scenarios, error, count } = await query

    if (error) {
      console.error("Database error during scenarios fetch:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch scenarios",
          code: "DATABASE_ERROR",
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      )
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        scenarios: scenarios || [],
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_count: count || 0,
          limit,
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage
        }
      }
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/scenarios:", error)
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
