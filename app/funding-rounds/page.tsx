import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { FundingRoundsOverview } from "@/components/funding-rounds-overview"
import { FundingRoundsList } from "@/components/funding-rounds-list"
import { FundingTimelineEnhanced } from "@/components/funding-timeline-enhanced"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"

export default async function FundingRoundsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const supabase = await createClient()

  // Set the current user context for RLS
  await supabase.rpc("set_config", {
    setting_name: "app.current_user_id",
    setting_value: userId,
    is_local: true,
  })

  // Fetch user's company
  const { data: companies, error: companiesError } = await supabase
    .from("companies")
    .select("*")
    .eq("clerk_user_id", userId)
    .limit(1)

  if (companiesError || !companies || companies.length === 0) {
    redirect("/onboarding")
  }

  const company = companies[0]

  // Fetch funding rounds
  const { data: fundingRounds } = await supabase
    .from("funding_rounds")
    .select("*")
    .eq("company_id", company.id)
    .order("closing_date", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader company={company} />
      <KeyboardShortcuts />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Funding Rounds</h1>
            <p className="text-gray-600">Manage your company's funding history and future rounds</p>
          </div>
        </div>

        {/* Overview */}
        <FundingRoundsOverview fundingRounds={fundingRounds || []} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Funding Rounds List */}
          <div className="lg:col-span-2">
            <FundingRoundsList companyId={company.id} fundingRounds={fundingRounds || []} />
          </div>

          {/* Enhanced Timeline */}
          <div>
            <FundingTimelineEnhanced fundingRounds={fundingRounds || []} />
          </div>
        </div>
      </main>
    </div>
  )
}
