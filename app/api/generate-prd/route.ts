import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { generatePRDPrompt, extractEdgeCases, generatePRDId } from "@/lib/prd-generator"
import { 
  generatePRDSchema, 
  iteratePRDSchema,
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

    // Determine validation schema based on action
    const action = (body as any)?.action || "generate"
    const schema = action === "iterate" ? iteratePRDSchema : generatePRDSchema
    
    // Validate the request data
    const validation = validateData(schema, body)
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
    if (action === "iterate") {
      const iterateData = validatedData as z.infer<typeof iteratePRDSchema>
      if (!iterateData.existing_prd || !iterateData.iteration_feedback) {
        return NextResponse.json(
          {
            error: "Existing PRD and feedback are required for iteration",
            code: "MISSING_ITERATION_DATA"
          },
          { status: 400 }
        )
      }
    }

    console.log("[v0] Generating PRD with AI SDK...")

    // Rate limiting check (simple implementation)
    const requestCount = await checkRateLimit(userId)
    if (requestCount > 50) { // 50 requests per hour
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED"
        },
        { status: 429 }
      )
    }

    try {
      const aiPrompt = generatePRDPrompt({
        prompt: validatedData.prompt,
        prdType: validatedData.prd_type,
        companyData: validatedData.company_data,
        capTableData: validatedData.cap_table_data,
        existingPRD: action === "iterate" ? (validatedData as any).existing_prd : undefined,
        iterationFeedback: action === "iterate" ? (validatedData as any).iteration_feedback : undefined,
        action,
      })

      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: aiPrompt,
        temperature: 0.7,
      })

      console.log("[v0] PRD generated successfully")

      // Validate generated content
      if (!text || text.length < 100) {
        throw new Error("Generated content too short or empty")
      }

      // Extract edge cases from the generated content
      const edgeCases = extractEdgeCases(text)

      // Create PRD data object with enhanced metadata
      const prdData = {
        id: generatePRDId(),
        title: action === "iterate" 
          ? (validatedData as any).existing_prd.title
          : `${validatedData.prd_type.replace("-", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())} PRD`,
        description: action === "iterate" 
          ? (validatedData as any).existing_prd.description 
          : validatedData.prompt.substring(0, 200) + (validatedData.prompt.length > 200 ? "..." : ""),
        content: text,
        edgeCases,
        createdAt: action === "iterate" 
          ? (validatedData as any).existing_prd.created_at 
          : new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: action === "iterate" 
          ? ((validatedData as any).existing_prd.version || 1) + 1 
          : 1,
        userId,
        prdType: validatedData.prd_type,
        wordCount: text.split(/\s+/).length,
        estimatedReadTime: Math.ceil(text.split(/\s+/).length / 200), // 200 words per minute
      }

      // Log successful generation for audit purposes
      console.log(`PRD generated successfully: ${prdData.id} by user ${userId} (${action})`);

      return NextResponse.json({
        success: true,
        data: prdData,
        message: `PRD ${action === 'iterate' ? 'updated' : 'generated'} successfully`
      })
    } catch (aiError) {
      console.error("AI generation error:", aiError)
      return NextResponse.json(
        {
          error: "Failed to generate PRD content",
          code: "AI_GENERATION_ERROR",
          details: process.env.NODE_ENV === 'development' ? 
            (aiError instanceof Error ? aiError.message : 'Unknown AI error') : 
            undefined
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[v0] PRD generation error:", error)
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

// Simple rate limiting function (in production, use Redis or similar)
async function checkRateLimit(userId: string): Promise<number> {
  // This is a simplified implementation
  // In production, you'd use Redis or a similar store
  const now = new Date()
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  
  // For now, return 0 to bypass rate limiting
  // Implement proper rate limiting with Redis in production
  return 0
}
