export interface AIRecommendation {
  id: string
  type: "optimization" | "warning" | "opportunity" | "recommendation"
  title: string
  description: string
  impact: "high" | "medium" | "low"
  category: "cap_table" | "funding" | "compliance" | "governance"
  actionable: boolean
  priority: number
}

export class CapTableAnalyzer {
  static analyzeOwnershipStructure(shareholders: any[], equityGrants: any[]): AIRecommendation[] {
    const recommendations: AIRecommendation[] = []

    const totalShares = equityGrants.reduce((sum, grant) => sum + (grant.shares_granted || 0), 0)

    // Analyze founder ownership
    const founderShares = equityGrants
      .filter((grant) => shareholders.find((s) => s.id === grant.shareholder_id)?.shareholder_type === "founder")
      .reduce((sum, grant) => sum + (grant.shares_granted || 0), 0)

    const founderOwnership = totalShares > 0 ? (founderShares / totalShares) * 100 : 0

    if (founderOwnership < 50) {
      recommendations.push({
        id: "low-founder-ownership",
        type: "warning",
        title: "Founder Control Risk",
        description: `Founders control only ${founderOwnership.toFixed(1)}% of the company. Consider consolidating founder equity or implementing voting agreements to maintain control.`,
        impact: "high",
        category: "governance",
        actionable: true,
        priority: 1,
      })
    }

    return recommendations
  }

  static analyzeOptionPool(equityGrants: any[]): AIRecommendation[] {
    const recommendations: AIRecommendation[] = []

    const totalShares = equityGrants.reduce((sum, grant) => sum + (grant.shares_granted || 0), 0)
    const optionShares = equityGrants
      .filter((grant) => grant.grant_type === "stock_option")
      .reduce((sum, grant) => sum + (grant.shares_granted || 0), 0)

    const optionPoolPercentage = totalShares > 0 ? (optionShares / totalShares) * 100 : 0

    if (optionPoolPercentage < 10) {
      recommendations.push({
        id: "small-option-pool",
        type: "recommendation",
        title: "Expand Employee Option Pool",
        description: `Current option pool is ${optionPoolPercentage.toFixed(1)}%. Industry standard is 15-20% for early-stage companies to attract top talent.`,
        impact: "medium",
        category: "cap_table",
        actionable: true,
        priority: 2,
      })
    }

    return recommendations
  }

  static analyzeVestingSchedules(equityGrants: any[]): AIRecommendation[] {
    const recommendations: AIRecommendation[] = []

    const unvestedGrants = equityGrants.filter((grant) => grant.vesting_schedule && !grant.is_fully_vested)

    const grantsWithoutCliff = unvestedGrants.filter((grant) => !grant.cliff_months || grant.cliff_months < 12)

    if (grantsWithoutCliff.length > 0) {
      recommendations.push({
        id: "missing-cliff-vesting",
        type: "optimization",
        title: "Implement Standard Vesting Cliffs",
        description: `${grantsWithoutCliff.length} grants lack proper cliff vesting. Consider implementing 12-month cliffs to protect against early departures.`,
        impact: "medium",
        category: "governance",
        actionable: true,
        priority: 3,
      })
    }

    return recommendations
  }

  static analyzeFundingReadiness(fundingRounds: any[], scenarios: any[]): AIRecommendation[] {
    const recommendations: AIRecommendation[] = []

    if (fundingRounds.length === 0 && scenarios.length > 0) {
      const fundingScenarios = scenarios.filter((s) => s.scenario_type === "funding_round")

      if (fundingScenarios.length === 0) {
        recommendations.push({
          id: "missing-funding-scenarios",
          type: "opportunity",
          title: "Model Funding Scenarios",
          description:
            "Create funding round scenarios to understand dilution impact and optimize valuation before approaching investors.",
          impact: "high",
          category: "funding",
          actionable: true,
          priority: 1,
        })
      }
    }

    return recommendations
  }

  static generateComprehensiveAnalysis(
    company: any,
    shareholders: any[],
    equityGrants: any[],
    fundingRounds: any[],
    scenarios: any[],
  ): AIRecommendation[] {
    const allRecommendations = [
      ...this.analyzeOwnershipStructure(shareholders, equityGrants),
      ...this.analyzeOptionPool(equityGrants),
      ...this.analyzeVestingSchedules(equityGrants),
      ...this.analyzeFundingReadiness(fundingRounds, scenarios),
    ]

    // Sort by priority and impact
    return allRecommendations.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      const impactOrder = { high: 3, medium: 2, low: 1 }
      return impactOrder[b.impact] - impactOrder[a.impact]
    })
  }
}
