import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ChatPRDIntegration } from "@/components/chatprd-integration"
import { createServerClient } from "@/lib/supabase/server"

export default async function PRDPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const supabase = createServerClient()

  // Fetch company data for context
  const { data: company } = await supabase.from("companies").select("*").eq("user_id", userId).single()

  // Fetch cap table data for context
  const { data: shareholders } = await supabase.from("shareholders").select("*").eq("company_id", company?.id)

  const { data: fundingRounds } = await supabase
    .from("funding_rounds")
    .select("*")
    .eq("company_id", company?.id)
    .order("round_date", { ascending: true })

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">PRD Generator</h1>
        <p className="text-muted-foreground mt-2">
          Generate and iterate Product Requirements Documents with AI assistance
        </p>
      </div>

      <ChatPRDIntegration
        companyData={company}
        capTableData={{
          shareholders,
          fundingRounds,
          totalShares: company?.total_shares || 0,
        }}
      />
    </div>
  )
}
