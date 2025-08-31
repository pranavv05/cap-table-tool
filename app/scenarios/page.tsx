import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { ScenariosOverview } from "@/components/scenarios-overview"
import { ScenariosList } from "@/components/scenarios-list"
import { ScenarioComparison } from "@/components/scenario-comparison"

export default async function ScenariosPage() {
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

  // Fetch scenarios
  const { data: scenarios } = await supabase
    .from("scenarios")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false })

  // Fetch current cap table data for baseline calculations
  const { data: shareholders } = await supabase
    .from("shareholders")
    .select(`
      *,
      equity_grants (*)
    `)
    .eq("company_id", company.id)

  const { data: equityGrants } = await supabase
    .from("equity_grants")
    .select(`
      *,
      shareholders (name, shareholder_type)
    `)
    .eq("company_id", company.id)
    .eq("is_active", true)

  const { data: fundingRounds } = await supabase
    .from("funding_rounds")
    .select("*")
    .eq("company_id", company.id)
    .order("closing_date", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader company={company} />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scenario Planning</h1>
            <p className="text-gray-600">Model different exit and funding scenarios to understand potential outcomes</p>
          </div>
        </div>

        {/* Overview */}
        <ScenariosOverview scenarios={scenarios || []} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scenarios List */}
          <div className="lg:col-span-2">
            <ScenariosList
              companyId={company.id}
              scenarios={scenarios || []}
              shareholders={shareholders || []}
              equityGrants={equityGrants || []}
              fundingRounds={fundingRounds || []}
            />
          </div>

          {/* Scenario Comparison */}
          <div>
            <ScenarioComparison
              scenarios={scenarios || []}
              shareholders={shareholders || []}
              equityGrants={equityGrants || []}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
