import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { 
  createCompanySchema, 
  updateCompanySchema, 
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
    const validation = validateData(createCompanySchema, body)
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

    // Additional business logic validation
    if (validatedData.authorized_shares < 1000) {
      return NextResponse.json(
        {
          error: "Authorized shares must be at least 1,000",
          code: "BUSINESS_RULE_VIOLATION"
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Prepare company data with proper types and required fields
    const companyData = {
      name: validatedData.name,
      description: validatedData.description || '',
      incorporation_date: validatedData.incorporation_date,
      jurisdiction: validatedData.jurisdiction,
      company_type: validatedData.company_type || 'C-Corp',
      authorized_shares: validatedData.authorized_shares || 10000000,
      par_value: validatedData.par_value || 0.001,
      clerk_user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Attempting to create company for user:', userId);
    
    try {
      const { data: company, error } = await supabase.rpc('create_company', {
        p_name: validatedData.name,
        p_description: validatedData.description || '',
        p_incorporation_date: validatedData.incorporation_date,
        p_jurisdiction: validatedData.jurisdiction,
        p_company_type: validatedData.company_type || 'C-Corp',
        p_authorized_shares: validatedData.authorized_shares || 10000000,
        p_par_value: validatedData.par_value || 0.001,
        p_clerk_user_id: userId
      });

      if (error) throw error;
      
      return NextResponse.json(company, { status: 201 });
    } catch (error) {
      console.error('Company creation failed:', error);
      return NextResponse.json(
        { 
          error: error.message || 'Failed to create company', 
          code: 'COMPANY_CREATION_FAILED',
          details: error.details
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in POST /api/companies:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      clerk_user_id: userId,
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order')
    }

    const validation = validateData(companyQuerySchema, queryParams)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Invalid query parameters", 
          code: "VALIDATION_ERROR",
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { page, limit, sort_by, sort_order } = validation.data

    const supabase = await createClient()

    await supabase.rpc("set_config", {
      setting_name: "app.current_user_id",
      setting_value: userId,
      is_local: true,
    })

    // Build query with pagination and sorting
    let query = supabase
      .from("companies")
      .select("*", { count: 'exact' })
      .eq("clerk_user_id", userId)

    // Apply sorting
    if (sort_by) {
      const validSortFields = ['name', 'created_at', 'incorporation_date', 'authorized_shares']
      if (validSortFields.includes(sort_by)) {
        query = query.order(sort_by, { ascending: sort_order === 'asc' })
      }
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: companies, error, count } = await query

    if (error) {
      console.error("Database error during company fetch:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch companies",
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
        companies: companies || [],
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
    console.error("Unexpected error in GET /api/companies:", error)
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
