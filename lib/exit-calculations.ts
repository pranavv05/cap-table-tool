export interface ExitOutcome {
  totalDistribution: number
  preferredPayouts: number
  commonPayouts: number
  averageReturnMultiple: number
  stakeholderOutcomes: Array<{
    id: string
    name: string
    type: string
    ownership: number
    payout: number
    returnMultiple: number
  }>
}

export async function calculateExitOutcomes({
  exitValue,
  fundingRounds,
  shareholders,
  equityGrants,
}: {
  exitValue: number
  fundingRounds: any[]
  shareholders: any[]
  equityGrants: any[]
}): Promise<ExitOutcome> {
  // Calculate total shares
  const totalShares = equityGrants.reduce((sum, grant) => sum + (grant.shares_granted || 0), 0)

  // Calculate liquidation waterfall
  let remainingValue = exitValue
  let preferredPayouts = 0

  // First, pay liquidation preferences
  const preferredRounds = fundingRounds.filter((round) => round.liquidation_preference > 0)
  preferredRounds.forEach((round) => {
    const liquidationAmount = round.total_investment * (round.liquidation_preference || 1)
    const payout = Math.min(remainingValue, liquidationAmount)
    preferredPayouts += payout
    remainingValue -= payout
  })

  const commonPayouts = remainingValue

  // Calculate outcomes for each stakeholder
  const stakeholderOutcomes = shareholders.map((shareholder) => {
    const shareholderGrants = equityGrants.filter((grant) => grant.shareholder_id === shareholder.id)
    const shareholderShares = shareholderGrants.reduce((sum, grant) => sum + (grant.shares_granted || 0), 0)
    const ownership = totalShares > 0 ? (shareholderShares / totalShares) * 100 : 0

    let payout = 0

    // Check if shareholder has preferred shares
    const hasPreferredShares = shareholderGrants.some((grant) => grant.grant_type.includes("preferred"))

    if (hasPreferredShares) {
      // Calculate preferred liquidation preference payout
      const investmentAmount = shareholderGrants
        .filter((grant) => grant.grant_type.includes("preferred"))
        .reduce((sum, grant) => sum + grant.shares_granted * (grant.strike_price || 1), 0)

      const liquidationPref =
        shareholderGrants.find((grant) => grant.liquidation_preference)?.liquidation_preference || 1
      const preferredPayout = Math.min(remainingValue, investmentAmount * liquidationPref)

      // Check if participating preferred
      const isParticipating = shareholderGrants.some((grant) => grant.participation_rights)
      if (isParticipating) {
        const proRataPayout = (ownership / 100) * commonPayouts
        payout = preferredPayout + proRataPayout
      } else {
        payout = Math.max(preferredPayout, (ownership / 100) * exitValue)
      }
    } else {
      // Common stock - gets pro-rata share of remaining value after preferred
      payout = (ownership / 100) * commonPayouts
    }

    // Calculate return multiple (simplified)
    const investmentAmount = shareholderGrants.reduce((sum, grant) => {
      return sum + grant.shares_granted * (grant.strike_price || 1)
    }, 0)

    const returnMultiple = investmentAmount > 0 ? payout / investmentAmount : 0

    return {
      id: shareholder.id,
      name: shareholder.name,
      type: shareholder.shareholder_type,
      ownership,
      payout,
      returnMultiple,
    }
  })

  const totalDistribution = stakeholderOutcomes.reduce((sum, outcome) => sum + outcome.payout, 0)
  const averageReturnMultiple =
    stakeholderOutcomes.length > 0
      ? stakeholderOutcomes.reduce((sum, outcome) => sum + outcome.returnMultiple, 0) / stakeholderOutcomes.length
      : 0

  return {
    totalDistribution,
    preferredPayouts,
    commonPayouts,
    averageReturnMultiple,
    stakeholderOutcomes: stakeholderOutcomes.sort((a, b) => b.payout - a.payout),
  }
}
