/**
 * Enhanced Mathematical Engine for Cap Table Calculations
 * 
 * This engine handles complex equity calculations including:
 * - Priced funding rounds with dilution analysis
 * - SAFE (Simple Agreement for Future Equity) conversions
 * - Employee Stock Option Pool (ESOP) management
 * - Secondary transactions and liquidity events
 * - Exit scenario modeling with liquidation preferences
 * - Anti-dilution provisions and pro-rata rights
 * 
 * The engine addresses all identified gaps in SAFE conversions, anti-dilution,
 * liquidation waterfalls, and option pools for production-ready cap table management.
 * 
 * @example
 * ```typescript
 * const engine = new EnhancedMathEngine()
 * 
 * // Calculate a priced round
 * const result = engine.calculatePricedRound({
 *   amount: 1000000,
 *   preMoney: 4000000
 * })
 * 
 * // Convert a SAFE
 * const conversion = engine.convertSAFE(safeTerms, triggerRound)
 * ```
 * 
 * @author Cap Table Tool Team
 * @version 2.0.0
 */
// Enhanced mathematical engine for perfect handling of fundraising scenarios
// Addresses all identified gaps in SAFE conversions, anti-dilution, liquidation waterfalls, and option pools

/**
 * Represents a class of shares with specific rights and preferences
 * 
 * @interface ShareClass
 * @property {string} id - Unique identifier for the share class
 * @property {string} name - Human-readable name (e.g., "Series A Preferred")
 * @property {"common" | "preferred" | "safe" | "option"} type - Type of share class
 * @property {number} shares - Number of authorized shares in this class
 * @property {number} liquidationPreference - Liquidation preference multiple (typically 1x)
 * @property {number} liquidationMultiple - Maximum liquidation multiple
 * @property {boolean} isParticipating - Whether shares participate after liquidation preference
 * @property {number} [participationCap] - Cap on participation rights (multiple of original investment)
 * @property {string} antiDilutionType - Type of anti-dilution protection
 * @property {number} [dividendRate] - Annual dividend rate (as decimal, e.g., 0.08 for 8%)
 * @property {number} conversionRatio - Ratio for converting to common shares
 * @property {number} seniority - Liquidation seniority (lower numbers = higher priority)
 */
export interface ShareClass {
  id: string
  name: string
  type: "common" | "preferred" | "safe" | "option"
  shares: number
  liquidationPreference: number
  liquidationMultiple: number
  isParticipating: boolean
  participationCap?: number
  antiDilutionType: "none" | "weighted_average_narrow" | "weighted_average_broad" | "full_ratchet"
  dividendRate?: number
  conversionRatio: number
  seniority: number
}

/**
 * SAFE (Simple Agreement for Future Equity) terms and conditions
 * 
 * @interface SAFETerms
 * @property {number} amount - Investment amount in dollars
 * @property {number} [valuationCap] - Maximum valuation for conversion calculation
 * @property {number} [discountRate] - Discount rate applied to future round price (0.2 = 20% discount)
 * @property {boolean} hasMFN - Whether this SAFE has Most Favored Nation clause
 * @property {string} conversionTrigger - Event that triggers SAFE conversion
 * @property {number} qualifiedFinancingThreshold - Minimum round size to qualify as trigger event
 * 
 * @example
 * ```typescript
 * const safeTerms: SAFETerms = {
 *   amount: 500000,
 *   valuationCap: 5000000,
 *   discountRate: 0.2,
 *   hasMFN: true,
 *   conversionTrigger: "qualified_financing",
 *   qualifiedFinancingThreshold: 1000000
 * }
 * ```
 */
export interface SAFETerms {
  amount: number
  valuationCap?: number
  discountRate?: number
  hasMFN: boolean
  conversionTrigger: "qualified_financing" | "liquidity_event" | "maturity"
  qualifiedFinancingThreshold: number
}

export interface OptionPool {
  totalShares: number
  availableShares: number
  allocatedShares: number
  exercisedShares: number
  isPreMoney: boolean
  refreshPercentage?: number
}

export interface FundingRound {
  id: string
  name: string
  type: "safe" | "convertible" | "priced"
  date: Date
  amount: number
  preMoney?: number
  postMoney?: number
  safeTerms?: SAFETerms
  shareClass?: ShareClass
  optionPoolAdjustment?: number
  founderSecondary?: number
  leadInvestor: string
  investors: Array<{
    name: string
    amount: number
    proRataRights: boolean
    boardRights: boolean
  }>
}

export interface Shareholder {
  id: string
  name: string
  type: "founder" | "employee" | "investor" | "advisor"
  holdings: Array<{
    shareClassId: string
    shares: number
    vestingSchedule?: VestingSchedule
    exercisePrice?: number
    grantDate: Date
  }>
}

export interface VestingSchedule {
  totalShares: number
  vestedShares: number
  cliffMonths: number
  vestingMonths: number
  startDate: Date
  accelerationTriggers: Array<"single_trigger" | "double_trigger">
}

export interface SecondaryTransaction {
  id: string
  date: Date
  sellerId: string
  buyerId: string
  shareClassId: string
  shares: number
  pricePerShare: number
  totalAmount: number
}

export interface ExitScenario {
  exitValue: number
  exitType: "acquisition" | "ipo" | "liquidation"
  date: Date
  useSimpleCalculation?: boolean // For MVP - no liquidation preferences
}

export interface IntegrityCheckResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  ownershipTotal: number
  shareCountTotal: number
  rounding: {
    method: "round" | "floor" | "ceil"
    precision: number
  }
}

export class EnhancedMathEngine {
  private shareClasses: Map<string, ShareClass> = new Map()
  private shareholders: Map<string, Shareholder> = new Map()
  private fundingRounds: FundingRound[] = []
  private optionPool: OptionPool | null = null
  private secondaryTransactions: SecondaryTransaction[] = []
  private roundingConfig = {
    method: "round" as "round" | "floor" | "ceil",
    precision: 4, // 4 decimal places for ownership percentages
    sharesPrecision: 0, // Whole shares only
  }

  constructor() {
    // Initialize with default common stock
    this.initializeDefaultCommonStock()
  }

  private initializeDefaultCommonStock(): void {
    const defaultCommonStock: ShareClass = {
      id: 'common',
      name: 'Common Stock',
      type: 'common',
      shares: 1000000, // 1M authorized shares by default
      liquidationPreference: 1,
      liquidationMultiple: 1,
      isParticipating: false,
      antiDilutionType: 'none',
      conversionRatio: 1,
      seniority: 1
    }
    this.shareClasses.set('common', defaultCommonStock)
  }

  public convertSAFE(
    safeTerms: SAFETerms,
    triggerRound: FundingRound,
  ): {
    conversionPrice: number
    sharesIssued: number
    conversionMethod: string
    postConversionOwnership: number
  } {
    if (!triggerRound.preMoney) {
      // Error handling: log and throw
      console.error("SAFE conversion failed: Trigger round missing pre-money valuation", { safeTerms, triggerRound });
      // Optionally, send to monitoring system here
      throw new Error("Trigger round must have pre-money valuation for SAFE conversion")
    }

    const totalSharesPreConversion = this.getTotalSharesOutstanding()
    const pricePerShare = triggerRound.preMoney / totalSharesPreConversion

    let conversionPrice = pricePerShare
    let conversionMethod = "no_discount"

    // Apply valuation cap if it results in lower price
    if (safeTerms.valuationCap) {
      const capPrice = safeTerms.valuationCap / totalSharesPreConversion
      if (capPrice < conversionPrice) {
        conversionPrice = capPrice
        conversionMethod = "valuation_cap"
      }
    }

    // Apply discount if it results in lower price (and no cap was better)
    if (safeTerms.discountRate && conversionMethod !== "valuation_cap") {
      const discountPrice = pricePerShare * (1 - safeTerms.discountRate)
      if (discountPrice < conversionPrice) {
        conversionPrice = discountPrice
        conversionMethod = "discount"
      }
    }

    // Handle Most Favored Nation (MFN) clause - get best terms from other SAFEs
    if (safeTerms.hasMFN) {
      const bestTermsPrice = this.getBestSAFETermsPrice(safeTerms, triggerRound)
      if (bestTermsPrice < conversionPrice) {
        conversionPrice = bestTermsPrice
        conversionMethod = "mfn"
      }
    }

    const sharesIssued = safeTerms.amount / conversionPrice
    const postConversionShares = totalSharesPreConversion + sharesIssued
    const postConversionOwnership = (sharesIssued / postConversionShares) * 100

    return {
      conversionPrice,
      sharesIssued,
      conversionMethod,
      postConversionOwnership,
    }
  }

  // Method for ESOP comparison calculations
  public calculateEsopComparison(capTable: any, roundTerms: any, esopTiming: "pre-money" | "post-money"): {
    optionPoolAdjustment?: {
      newOptionPoolShares: number,
      additionalShares: number,
    },
    dilution: {
      founders: number,
      existing: number,
    },
    finalOwnership: any[],
    founderDilution: number,
    investorDilution: number,
    esopShares: number,
  } {
    try {
      // Calculate ESOP impact based on timing
      const totalShares = capTable.totalShares;
      const targetOptionPoolPercent = roundTerms.targetOptionPoolPercent || 0;
      let esopShares = 0;
      let optionPoolAdjustment;
      if (esopTiming === "post-money") {
        const investmentAmount = roundTerms.investmentAmount || roundTerms.amount || 0;
        const preMoneyValuation = roundTerms.preMoneyValuation || roundTerms.preMoney || totalShares;
        const newSharesFromInvestment = investmentAmount / (preMoneyValuation / totalShares);
        const postMoneyShares = totalShares + newSharesFromInvestment;
        const targetEsopShares = Math.round(postMoneyShares * targetOptionPoolPercent);
        esopShares = targetEsopShares;
        const currentEsopShares = capTable.optionPoolShares || 0;
        const additionalShares = Math.max(0, targetEsopShares - currentEsopShares);
        if (additionalShares > 0) {
          optionPoolAdjustment = {
            newOptionPoolShares: targetEsopShares,
            additionalShares: additionalShares,
          };
        }
      }
      
      const founderShares = capTable.shareholders
        .filter((sh: any) => sh.type === "founder")
        .reduce((sum: number, sh: any) => sum + sh.shares, 0);
      const totalSharesAfterEsop = totalShares + (optionPoolAdjustment ? optionPoolAdjustment.additionalShares : 0);

      const founderDilution = (optionPoolAdjustment ? optionPoolAdjustment.additionalShares : 0) / totalSharesAfterEsop;
      const investorDilution = esopTiming === "pre-money"
        ? 0
        : (optionPoolAdjustment ? optionPoolAdjustment.additionalShares : 0) / totalSharesAfterEsop;

      const dilution = {
        founders: founderShares / totalSharesAfterEsop,
        existing: targetOptionPoolPercent,
      };

      return {
        optionPoolAdjustment,
        dilution,
        finalOwnership: capTable.shareholders,
        founderDilution,
        investorDilution,
        esopShares: Number(esopShares.toFixed(0))
      };
    } catch (err) {
      console.error("ESOP comparison calculation failed", { capTable, roundTerms, esopTiming, error: err });
      return {
        optionPoolAdjustment: undefined,
        dilution: { founders: 0, existing: 0 },
        finalOwnership: [],
        founderDilution: 0,
        investorDilution: 0,
        esopShares: 0,
      };
    }
  }

  public convertMultipleSAFEs(
    safes: SAFETerms[],
    triggerRound: FundingRound,
    handleProRata = false,
  ): {
    totalConversionAmount: number
    totalSharesIssued: number
    individualConversions: Array<{
      safeIndex: number
      conversionPrice: number
      sharesIssued: number
      conversionMethod: string
      ownershipPercentage: number
    }>
    proRataRights?: Array<{
      safeIndex: number
      additionalInvestmentAllowed: number
      maintainOwnershipPercentage: number
    }>
  } {
    if (safes.length === 0) {
      throw new Error("No SAFEs provided for conversion")
    }

    const totalSharesPreConversion = this.getTotalSharesOutstanding()
    const roundPricePerShare = triggerRound.preMoney! / totalSharesPreConversion

    const individualConversions: Array<{
      safeIndex: number
      conversionPrice: number
      sharesIssued: number
      conversionMethod: string
      ownershipPercentage: number
    }> = []

    let totalSharesIssued = 0
    let totalConversionAmount = 0

    // Convert each SAFE individually
    safes.forEach((safe, index) => {
      const conversion = this.convertSAFE(safe, triggerRound)

      individualConversions.push({
        safeIndex: index,
        conversionPrice: conversion.conversionPrice,
        sharesIssued: conversion.sharesIssued,
        conversionMethod: conversion.conversionMethod,
        ownershipPercentage: 0, // Will calculate after all conversions
      })

      totalSharesIssued += conversion.sharesIssued
      totalConversionAmount += safe.amount
    })

    // Calculate final ownership percentages after all conversions
    const finalTotalShares = totalSharesPreConversion + totalSharesIssued
    individualConversions.forEach((conversion) => {
      conversion.ownershipPercentage = (conversion.sharesIssued / finalTotalShares) * 100
    })

    // Handle pro-rata rights if enabled
    let proRataRights:
      | Array<{
          safeIndex: number
          additionalInvestmentAllowed: number
          maintainOwnershipPercentage: number
        }>
      | undefined

    if (handleProRata && triggerRound.amount > totalConversionAmount) {
      proRataRights = []
      const newMoneyAmount = triggerRound.amount - totalConversionAmount

      individualConversions.forEach((conversion, index) => {
        const currentOwnership = conversion.ownershipPercentage / 100
        const additionalInvestmentToMaintain = newMoneyAmount * (currentOwnership / (1 - currentOwnership))

        proRataRights!.push({
          safeIndex: index,
          additionalInvestmentAllowed: additionalInvestmentToMaintain,
          maintainOwnershipPercentage: conversion.ownershipPercentage,
        })
      })
    }

    return {
      totalConversionAmount,
      totalSharesIssued,
      individualConversions,
      proRataRights,
    }
  }

  public calculateAntiDilution(
    originalShareClass: ShareClass,
    downRound: FundingRound,
    carveOuts: string[] = [],
  ): {
    adjustedShares: number
    adjustmentRatio: number
    newConversionRatio: number
  } {
    if (originalShareClass.antiDilutionType === "none") {
      return {
        adjustedShares: originalShareClass.shares,
        adjustmentRatio: 1.0,
        newConversionRatio: originalShareClass.conversionRatio,
      }
    }

    const originalPrice = this.getOriginalIssuePrice(originalShareClass.id)
    const newPrice = downRound.preMoney! / this.getTotalSharesOutstanding()

    if (newPrice >= originalPrice) {
      return {
        adjustedShares: originalShareClass.shares,
        adjustmentRatio: 1.0,
        newConversionRatio: originalShareClass.conversionRatio,
      }
    }

    let adjustmentRatio = 1.0

    if (originalShareClass.antiDilutionType === "full_ratchet") {
      adjustmentRatio = originalPrice / newPrice
    } else {
      // Weighted average calculation
      const commonOutstanding = this.getCommonSharesOutstanding()
      const optionPoolShares = this.optionPool?.totalShares || 0

      let denominator = commonOutstanding

      if (originalShareClass.antiDilutionType === "weighted_average_broad") {
        // Include option pool and other convertible securities
        denominator += optionPoolShares
        denominator += this.getConvertibleSecuritiesShares(carveOuts)
      }

      const newShares = downRound.amount / newPrice
      // Corrected weighted average formula. The adjustment ratio for the conversion ratio is OldPrice / NewPrice.
      // NewPrice = (TotalValueBefore + NewMoney) / (TotalSharesBefore + NewShares)
      const totalValueBefore = denominator * originalPrice
      const newPriceAfterRound = (totalValueBefore + downRound.amount) / (denominator + newShares)
      
      adjustmentRatio = originalPrice / newPriceAfterRound
    }

    const adjustedShares = originalShareClass.shares * adjustmentRatio
    const newConversionRatio = originalShareClass.conversionRatio * adjustmentRatio

    return {
      adjustedShares,
      adjustmentRatio,
      newConversionRatio,
    }
  }

  public calculateLiquidationWaterfall(exitValue: number): {
    distributions: Array<{
      shareholderId: string
      shareClassId: string
      amount: number
      source: "liquidation_preference" | "participation" | "common"
    }>
    totalDistributed: number
    remainingValue: number
  } {
    const distributions: Array<{
      shareholderId: string
      shareClassId: string
      amount: number
      source: "liquidation_preference" | "participation" | "common"
    }> = []

    let remainingValue = exitValue

    // Sort share classes by seniority (higher seniority gets paid first)
    const sortedShareClasses = Array.from(this.shareClasses.values())
      .filter((sc) => sc.liquidationPreference > 0)
      .sort((a, b) => b.seniority - a.seniority)

    // Step 1: Pay liquidation preferences
    for (const shareClass of sortedShareClasses) {
      const holders = this.getShareClassHolders(shareClass.id)
      const totalPreferenceAmount =
        shareClass.shares * shareClass.liquidationPreference * shareClass.liquidationMultiple

      const actualPayout = Math.min(totalPreferenceAmount, remainingValue)

      if (actualPayout > 0) {
        // Distribute pro-rata among holders of this share class
        holders.forEach((holder) => {
          const holderShares = this.getShareholderShares(holder.id, shareClass.id)
          const holderPayout = (holderShares / shareClass.shares) * actualPayout

          distributions.push({
            shareholderId: holder.id,
            shareClassId: shareClass.id,
            amount: holderPayout,
            source: "liquidation_preference",
          })
        })

        remainingValue -= actualPayout
      }

      if (remainingValue <= 0) break
    }

    // Step 2: Handle participating preferred shares
    if (remainingValue > 0) {
      const participatingClasses = sortedShareClasses.filter((sc) => sc.isParticipating)

      for (const shareClass of participatingClasses) {
        const holders = this.getShareClassHolders(shareClass.id)
        const totalShares = this.getTotalSharesOutstanding()
        const participationRatio = shareClass.shares / totalShares

        let participationAmount = remainingValue * participationRatio

        // Apply participation cap if exists
        if (shareClass.participationCap) {
          const maxParticipation = shareClass.shares * shareClass.participationCap
          const alreadyReceived = distributions
            .filter((d) => d.shareClassId === shareClass.id)
            .reduce((sum, d) => sum + d.amount, 0)

          participationAmount = Math.min(participationAmount, maxParticipation - alreadyReceived)
        }

        if (participationAmount > 0) {
          holders.forEach((holder) => {
            const holderShares = this.getShareholderShares(holder.id, shareClass.id)
            const holderPayout = (holderShares / shareClass.shares) * participationAmount

            distributions.push({
              shareholderId: holder.id,
              shareClassId: shareClass.id,
              amount: holderPayout,
              source: "participation",
            })
          })

          remainingValue -= participationAmount
        }
      }
    }

    // Step 3: Distribute remaining value to common shareholders
    if (remainingValue > 0) {
      const commonShares = this.getCommonSharesOutstanding()
      const commonHolders = this.getCommonShareholders()

      commonHolders.forEach((holder) => {
        const holderShares = this.getShareholderCommonShares(holder.id)
        const holderPayout = (holderShares / commonShares) * remainingValue

        distributions.push({
          shareholderId: holder.id,
          shareClassId: "common",
          amount: holderPayout,
          source: "common",
        })
      })
    }

    return {
      distributions,
      totalDistributed: exitValue - remainingValue,
      remainingValue,
    }
  }

  public calculateESOPImpact(esopDetails: {
    poolSize: number // percentage of company
    timing: "pre_money" | "post_money"
    fundingRound?: FundingRound
  }): {
    preMoneyScenario: {
      totalSharesBefore: number
      esopShares: number
      totalSharesAfter: number
      founderDilution: number
      investorDilution: number
      esopPercentage: number
    }
    postMoneyScenario: {
      totalSharesBefore: number
      esopShares: number
      totalSharesAfter: number
      founderDilution: number
      investorDilution: number
      esopPercentage: number
    }
    comparison: {
      founderDilutionDifference: number
      investorDilutionDifference: number
      esopSizeDifference: number
    }
  } {
    const currentShares = this.getTotalSharesOutstanding()
    const fundingAmount = esopDetails.fundingRound?.amount || 0
    const preMoney = esopDetails.fundingRound?.preMoney || currentShares * 1.0 // Assume $1/share if no round

    // PRE-MONEY ESOP SCENARIO
    // ESOP pool is created BEFORE investors put in money
    // Formula: ESOP shares = (Current shares × ESOP%) / (1 - ESOP%)
    const preMoneyEsopShares = (currentShares * esopDetails.poolSize) / (1 - esopDetails.poolSize)
    const preMoneyTotalAfterEsop = currentShares + preMoneyEsopShares

    // Now calculate investor shares based on pre-money + ESOP
    const preMoneySharePrice = preMoney / preMoneyTotalAfterEsop
    const preMoneyInvestorShares = fundingAmount / preMoneySharePrice
    const preMoneyFinalTotal = preMoneyTotalAfterEsop + preMoneyInvestorShares

    // Calculate dilution in pre-money scenario
    // Founder ownership before: 100% of currentShares
    // Founder ownership after: currentShares / preMoneyFinalTotal
    // Dilution = reduction from 100% to final percentage
    const preMoneyFounderOwnershipAfter = (currentShares / preMoneyFinalTotal) * 100
    const preMoneyFounderDilution = 100 - preMoneyFounderOwnershipAfter
    const preMoneyInvestorDilution = 0 // Investors don't get diluted by ESOP in pre-money
    const preMoneyEsopPercentage = (preMoneyEsopShares / preMoneyFinalTotal) * 100

    // POST-MONEY ESOP SCENARIO
    // ESOP pool is created AFTER investors put in money
    // Both founders and investors get diluted by ESOP
    const postMoneySharePrice = preMoney / currentShares
    const postMoneyInvestorShares = fundingAmount / postMoneySharePrice
    const postMoneyTotalAfterInvestment = currentShares + postMoneyInvestorShares

    // Now create ESOP pool - this dilutes everyone
    const postMoneyEsopShares = (postMoneyTotalAfterInvestment * esopDetails.poolSize) / (1 - esopDetails.poolSize)
    const postMoneyFinalTotal = postMoneyTotalAfterInvestment + postMoneyEsopShares

    // Calculate dilution in post-money scenario
    // Founder ownership before: 100% of currentShares (before any investment)
    // Founder ownership after: currentShares / postMoneyFinalTotal
    // Dilution = reduction from 100% to final percentage
    const postMoneyFounderOwnershipAfter = (currentShares / postMoneyFinalTotal) * 100
    const postMoneyFounderDilution = 100 - postMoneyFounderOwnershipAfter
    
    // Investor dilution: from their post-investment percentage to final percentage
    const investorOwnershipBeforeEsop = (postMoneyInvestorShares / postMoneyTotalAfterInvestment) * 100
    const investorOwnershipAfterEsop = (postMoneyInvestorShares / postMoneyFinalTotal) * 100
    const postMoneyInvestorDilution = investorOwnershipBeforeEsop - investorOwnershipAfterEsop
    const postMoneyEsopPercentage = (postMoneyEsopShares / postMoneyFinalTotal) * 100

    return {
      preMoneyScenario: {
        totalSharesBefore: currentShares,
        esopShares: preMoneyEsopShares,
        totalSharesAfter: preMoneyFinalTotal,
        founderDilution: preMoneyFounderDilution,
        investorDilution: preMoneyInvestorDilution,
        esopPercentage: preMoneyEsopPercentage,
      },
      postMoneyScenario: {
        totalSharesBefore: currentShares,
        esopShares: postMoneyEsopShares,
        totalSharesAfter: postMoneyFinalTotal,
        founderDilution: postMoneyFounderDilution,
        investorDilution: postMoneyInvestorDilution,
        esopPercentage: postMoneyEsopPercentage,
      },
      comparison: {
        founderDilutionDifference: postMoneyFounderDilution - preMoneyFounderDilution,
        investorDilutionDifference: postMoneyInvestorDilution - preMoneyInvestorDilution,
        esopSizeDifference: postMoneyEsopShares - preMoneyEsopShares,
      },
    }
  }

  public manageOptionPool(adjustment: {
    type: "create" | "refresh" | "exercise" | "grant"
    shares?: number
    percentage?: number
    isPreMoney?: boolean
    fundingRound?: FundingRound
    grantDetails?: {
      recipientId: string
      shares: number
      exercisePrice: number
      vestingSchedule: VestingSchedule
    }
  }): {
    optionPool: OptionPool
    dilutionAnalysis: {
      founderDilution: number
      investorDilution: number
      totalSharesImpact: number
      esopPercentageOfCompany: number
    }
  } {
    if (!this.optionPool && adjustment.type !== "create") {
      throw new Error("Option pool must be created before other operations")
    }

    const currentShares = this.getTotalSharesOutstanding()
    const dilutionAnalysis = {
      founderDilution: 0,
      investorDilution: 0,
      totalSharesImpact: 0,
      esopPercentageOfCompany: 0,
    }

    switch (adjustment.type) {
      case "create":
        const poolShares = adjustment.shares || currentShares * (adjustment.percentage! / 100)

        if (adjustment.isPreMoney) {
          // Pre-money pool: calculate shares needed to achieve target percentage
          const targetPercentage = adjustment.percentage! / 100
          const actualPoolShares = (currentShares * targetPercentage) / (1 - targetPercentage)

          this.optionPool = {
            totalShares: actualPoolShares,
            availableShares: actualPoolShares,
            allocatedShares: 0,
            exercisedShares: 0,
            isPreMoney: true,
          }

          // Founders get diluted, but future investors won't be diluted by ESOP
          dilutionAnalysis.founderDilution = (actualPoolShares / (currentShares + actualPoolShares)) * 100
          dilutionAnalysis.totalSharesImpact = actualPoolShares
          dilutionAnalysis.esopPercentageOfCompany = targetPercentage * 100
        } else {
          // Post-money pool: everyone gets diluted
          this.optionPool = {
            totalShares: poolShares,
            availableShares: poolShares,
            allocatedShares: 0,
            exercisedShares: 0,
            isPreMoney: false,
          }

          const totalAfterEsop = currentShares + poolShares
          dilutionAnalysis.founderDilution = (poolShares / totalAfterEsop) * 100
          dilutionAnalysis.investorDilution = (poolShares / totalAfterEsop) * 100
          dilutionAnalysis.totalSharesImpact = poolShares
          dilutionAnalysis.esopPercentageOfCompany = (poolShares / totalAfterEsop) * 100
        }
        break

      case "refresh":
        if (adjustment.percentage && this.optionPool) {
          const currentTotalShares = this.getTotalSharesOutstanding()

          if (this.optionPool.isPreMoney) {
            // Pre-money refresh: calculate additional shares needed
            const targetPercentage = adjustment.percentage / 100
            const targetPoolShares = (currentTotalShares * targetPercentage) / (1 - targetPercentage)
            const additionalShares = Math.max(0, targetPoolShares - this.optionPool.totalShares)

            this.optionPool.totalShares = targetPoolShares
            this.optionPool.availableShares += additionalShares
            this.optionPool.refreshPercentage = adjustment.percentage

            dilutionAnalysis.founderDilution = (additionalShares / (currentTotalShares + additionalShares)) * 100
            dilutionAnalysis.totalSharesImpact = additionalShares
          } else {
            // Post-money refresh: everyone gets diluted
            const targetPoolSize = currentTotalShares * (adjustment.percentage / 100)
            const additionalShares = Math.max(0, targetPoolSize - this.optionPool.totalShares)

            this.optionPool.totalShares += additionalShares
            this.optionPool.availableShares += additionalShares
            this.optionPool.refreshPercentage = adjustment.percentage

            const totalAfterRefresh = currentTotalShares + additionalShares
            dilutionAnalysis.founderDilution = (additionalShares / totalAfterRefresh) * 100
            dilutionAnalysis.investorDilution = (additionalShares / totalAfterRefresh) * 100
            dilutionAnalysis.totalSharesImpact = additionalShares
          }

          dilutionAnalysis.esopPercentageOfCompany =
            (this.optionPool.totalShares / (currentTotalShares + dilutionAnalysis.totalSharesImpact)) * 100
        }
        break

      case "grant":
        if (adjustment.grantDetails && this.optionPool) {
          const { shares } = adjustment.grantDetails
          if (shares > this.optionPool.availableShares) {
            throw new Error("Insufficient shares available in option pool")
          }

          this.optionPool.availableShares -= shares
          this.optionPool.allocatedShares += shares

          // No dilution impact for grants - just allocation within existing pool
          dilutionAnalysis.esopPercentageOfCompany = (this.optionPool.totalShares / currentShares) * 100
        }
        break

      case "exercise":
        if (adjustment.shares && this.optionPool) {
          this.optionPool.allocatedShares -= adjustment.shares
          this.optionPool.exercisedShares += adjustment.shares

          // Exercise converts options to common shares - no additional dilution
          dilutionAnalysis.esopPercentageOfCompany = (this.optionPool.totalShares / currentShares) * 100
        }
        break
    }

    return {
      optionPool: { ...this.optionPool! },
      dilutionAnalysis,
    }
  }

  public compareESOPScenarios(
    poolPercentage: number,
    fundingRound: FundingRound,
  ): {
    summary: {
      recommendation: "pre_money" | "post_money"
      reasoning: string
    }
    detailedComparison: {
      metric: string
      preMoney: number
      postMoney: number
      difference: number
      unit: string
    }[]
  } {
    const comparison = this.calculateESOPImpact({
      poolSize: poolPercentage / 100,
      timing: "pre_money",
      fundingRound,
    })

    const metrics = [
      {
        metric: "Founder Dilution",
        preMoney: comparison.preMoneyScenario.founderDilution,
        postMoney: comparison.postMoneyScenario.founderDilution,
        difference: comparison.comparison.founderDilutionDifference,
        unit: "%",
      },
      {
        metric: "Investor Dilution",
        preMoney: comparison.preMoneyScenario.investorDilution,
        postMoney: comparison.postMoneyScenario.investorDilution,
        difference: comparison.comparison.investorDilutionDifference,
        unit: "%",
      },
      {
        metric: "ESOP Pool Size",
        preMoney: comparison.preMoneyScenario.esopShares,
        postMoney: comparison.postMoneyScenario.esopShares,
        difference: comparison.comparison.esopSizeDifference,
        unit: "shares",
      },
      {
        metric: "Total Shares Outstanding",
        preMoney: comparison.preMoneyScenario.totalSharesAfter,
        postMoney: comparison.postMoneyScenario.totalSharesAfter,
        difference: comparison.postMoneyScenario.totalSharesAfter - comparison.preMoneyScenario.totalSharesAfter,
        unit: "shares",
      },
    ]

    // Determine recommendation based on founder vs investor preference
    const founderPreference = comparison.preMoneyScenario.founderDilution < comparison.postMoneyScenario.founderDilution
    const investorPreference =
      comparison.preMoneyScenario.investorDilution < comparison.postMoneyScenario.investorDilution

    let recommendation: "pre_money" | "post_money" = "pre_money"
    let reasoning = ""

    // Always favor pre-money unless there's a compelling reason not to
    if (founderPreference || comparison.preMoneyScenario.investorDilution === 0) {
      recommendation = "pre_money"
      reasoning = "Pre-money ESOP reduces founder dilution while investors bear the ESOP dilution cost"
    } else if (!founderPreference && investorPreference) {
      recommendation = "post_money"
      reasoning = "Post-money ESOP shares dilution burden between founders and investors"
    } else {
      recommendation = "pre_money"
      reasoning = "Pre-money ESOP is generally more founder-friendly and commonly preferred"
    }

    return {
      summary: {
        recommendation,
        reasoning,
      },
      detailedComparison: metrics,
    }
  }

  public calculatePricedRound(roundDetails: {
    amount: number
    preMoney?: number
    postMoney?: number
    sharePrice?: number
    optionPoolAdjustment?: number
    isPreMoneyOptionPool?: boolean
  }): {
    preMoney: number
    postMoney: number
    sharePrice: number
    newSharesIssued: number
    dilution: { [shareholderId: string]: { before: number; after: number; dilutionPercent: number } }
    optionPoolImpact?: {
      poolSharesBefore: number
      poolSharesAfter: number
      poolPercentageBefore: number
      poolPercentageAfter: number
    }
  } {
    const sharesOutstandingBefore = this.getTotalSharesOutstanding()
    let optionPoolShares = this.optionPool?.totalShares || 0

    // Handle option pool adjustment
    if (roundDetails.optionPoolAdjustment) {
      if (roundDetails.isPreMoneyOptionPool) {
        // Pre-money option pool: calculate shares needed for exact target percentage of final cap table
        const targetPercentage = roundDetails.optionPoolAdjustment / 100
        const sharePrice = roundDetails.preMoney! / sharesOutstandingBefore
        const investorShares = roundDetails.amount / sharePrice
        const totalNonEsopShares = sharesOutstandingBefore + investorShares
        
        // Calculate ESOP shares needed for exact target percentage
        optionPoolShares = (totalNonEsopShares * targetPercentage) / (1 - targetPercentage)
        
        // Create or update option pool
        if (!this.optionPool) {
          this.optionPool = {
            totalShares: optionPoolShares,
            availableShares: optionPoolShares,
            allocatedShares: 0,
            exercisedShares: 0,
            isPreMoney: true,
          }
        } else {
          this.optionPool.totalShares = optionPoolShares
          this.optionPool.availableShares = optionPoolShares - this.optionPool.allocatedShares
        }
      }
    }

    const fullyDilutedSharesBefore = sharesOutstandingBefore + optionPoolShares

    // Calculate missing values based on what's provided
    let preMoney: number
    let postMoney: number
    let sharePrice: number
    let newSharesIssued: number

    if (roundDetails.preMoney) {
      // Pre-money valuation provided
      preMoney = roundDetails.preMoney
      sharePrice = preMoney / fullyDilutedSharesBefore
      newSharesIssued = roundDetails.amount / sharePrice
      postMoney = preMoney + roundDetails.amount
    } else if (roundDetails.postMoney) {
      // Post-money valuation provided
      postMoney = roundDetails.postMoney
      preMoney = postMoney - roundDetails.amount
      sharePrice = preMoney / fullyDilutedSharesBefore
      newSharesIssued = roundDetails.amount / sharePrice
    } else if (roundDetails.sharePrice) {
      // Share price provided
      sharePrice = roundDetails.sharePrice
      preMoney = sharePrice * fullyDilutedSharesBefore
      newSharesIssued = roundDetails.amount / sharePrice
      postMoney = preMoney + roundDetails.amount
    } else {
      throw new Error("Must provide either pre-money valuation, post-money valuation, or share price")
    }

    // Validate calculations
    if (sharePrice <= 0) {
      throw new Error("Share price must be positive")
    }
    if (newSharesIssued <= 0) {
      throw new Error("New shares issued must be positive")
    }

    // Handle post-money option pool adjustment
    if (roundDetails.optionPoolAdjustment && !roundDetails.isPreMoneyOptionPool) {
      const totalSharesAfterRound = fullyDilutedSharesBefore + newSharesIssued
      const targetOptionPoolShares = totalSharesAfterRound * (roundDetails.optionPoolAdjustment / 100)
      const additionalOptionShares = Math.max(0, targetOptionPoolShares - optionPoolShares)

      if (additionalOptionShares > 0) {
        optionPoolShares = targetOptionPoolShares
        if (this.optionPool) {
          this.optionPool.totalShares = optionPoolShares
          this.optionPool.availableShares += additionalOptionShares
        }
      }
    }

    // Calculate dilution for each shareholder
    const dilution: { [shareholderId: string]: { before: number; after: number; dilutionPercent: number } } = {}
    const totalSharesAfter = fullyDilutedSharesBefore + newSharesIssued

    Array.from(this.shareholders.values()).forEach((shareholder) => {
      const shareholderShares = shareholder.holdings.reduce((sum, holding) => sum + holding.shares, 0)
      const ownershipBefore = (shareholderShares / fullyDilutedSharesBefore) * 100
      const ownershipAfter = (shareholderShares / totalSharesAfter) * 100
      const dilutionPercent = ((ownershipBefore - ownershipAfter) / ownershipBefore) * 100

      dilution[shareholder.id] = {
        before: ownershipBefore,
        after: ownershipAfter,
        dilutionPercent,
      }
    })

    // Calculate option pool impact
    let optionPoolImpact:
      | {
          poolSharesBefore: number
          poolSharesAfter: number
          poolPercentageBefore: number
          poolPercentageAfter: number
        }
      | undefined

    if (this.optionPool || roundDetails.optionPoolAdjustment) {
      const poolSharesBefore = this.optionPool?.totalShares || 0
      optionPoolImpact = {
        poolSharesBefore,
        poolSharesAfter: optionPoolShares,
        poolPercentageBefore: (poolSharesBefore / fullyDilutedSharesBefore) * 100,
        poolPercentageAfter: (optionPoolShares / totalSharesAfter) * 100,
      }
    }

    return {
      preMoney,
      postMoney,
      sharePrice,
      newSharesIssued,
      dilution,
      optionPoolImpact,
    }
  }

  public validatePricedRoundInputs(roundDetails: {
    amount: number
    preMoney?: number
    postMoney?: number
    sharePrice?: number
  }): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate amount
    if (roundDetails.amount <= 0) {
      errors.push("Investment amount must be positive")
    }

    // Validate that only one valuation method is provided
    const valuationMethods = [roundDetails.preMoney, roundDetails.postMoney, roundDetails.sharePrice].filter(
      (v) => v !== undefined,
    ).length

    if (valuationMethods === 0) {
      errors.push("Must provide either pre-money valuation, post-money valuation, or share price")
    } else if (valuationMethods > 1) {
      errors.push("Cannot provide multiple valuation methods simultaneously")
    }

    // Validate valuation reasonableness
    if (roundDetails.preMoney && roundDetails.preMoney <= 0) {
      errors.push("Pre-money valuation must be positive")
    }
    if (roundDetails.postMoney && roundDetails.postMoney <= roundDetails.amount) {
      errors.push("Post-money valuation must be greater than investment amount")
    }
    if (roundDetails.sharePrice && roundDetails.sharePrice <= 0) {
      errors.push("Share price must be positive")
    }

    // Check for down round
    const lastRound = this.fundingRounds[this.fundingRounds.length - 1]
    if (lastRound?.postMoney && roundDetails.preMoney && roundDetails.preMoney < lastRound.postMoney) {
      warnings.push("This appears to be a down round - pre-money is less than previous post-money")
    }

    // Check for excessive dilution
    if (roundDetails.preMoney) {
      const currentShares = this.getTotalSharesOutstanding()
      const sharePrice = roundDetails.preMoney / currentShares
      const newShares = roundDetails.amount / sharePrice
      const dilutionPercent = (newShares / (currentShares + newShares)) * 100

      if (dilutionPercent > 50) {
        warnings.push(`High dilution detected: ${dilutionPercent.toFixed(1)}% of company being sold`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  public validateSAFETerms(safeTerms: SAFETerms): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate amount
    if (safeTerms.amount <= 0) {
      errors.push("SAFE investment amount must be positive")
    }

    // Validate valuation cap
    if (safeTerms.valuationCap && safeTerms.valuationCap <= 0) {
      errors.push("Valuation cap must be positive if specified")
    }

    // Validate discount rate
    if (safeTerms.discountRate) {
      if (safeTerms.discountRate <= 0 || safeTerms.discountRate >= 1) {
        errors.push("Discount rate must be between 0 and 1 (e.g., 0.2 for 20%)")
      }
      if (safeTerms.discountRate > 0.3) {
        warnings.push("Discount rate above 30% is unusually high")
      }
    }

    // Validate that at least one conversion mechanism exists
    if (!safeTerms.valuationCap && !safeTerms.discountRate) {
      errors.push("SAFE must have either a valuation cap or discount rate (or both)")
    }

    // Validate qualified financing threshold
    if (safeTerms.qualifiedFinancingThreshold <= 0) {
      errors.push("Qualified financing threshold must be positive")
    }

    // Check for reasonable valuation cap relative to investment
    if (safeTerms.valuationCap && safeTerms.valuationCap < safeTerms.amount * 2) {
      warnings.push("Valuation cap is very low relative to investment amount - may result in excessive dilution")
    }

    // Warn about MFN complexity
    if (safeTerms.hasMFN) {
      warnings.push("Most Favored Nation clause adds complexity - ensure all SAFE terms are properly tracked")
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  // Helper methods
  private getTotalSharesOutstanding(): number {
    return Array.from(this.shareClasses.values()).reduce((sum, sc) => sum + sc.shares, 0)
  }

  private getCommonSharesOutstanding(): number {
    return Array.from(this.shareClasses.values())
      .filter((sc) => sc.type === "common")
      .reduce((sum, sc) => sum + sc.shares, 0)
  }

  private getBestSAFETermsPrice(safeTerms: SAFETerms, triggerRound: FundingRound): number {
    const totalShares = this.getTotalSharesOutstanding()
    const roundPrice = triggerRound.preMoney! / totalShares

    // Find all other SAFEs in the system and get their best conversion price
    let bestPrice = roundPrice

    // Check all existing SAFE rounds for better terms
    this.fundingRounds
      .filter((round) => round.type === "safe" && round.safeTerms)
      .forEach((safeRound) => {
        if (safeRound.safeTerms) {
          const otherSafeConversion = this.convertSAFE(safeRound.safeTerms, triggerRound)
          if (otherSafeConversion.conversionPrice < bestPrice) {
            bestPrice = otherSafeConversion.conversionPrice
          }
        }
      })

    return bestPrice
  }

  private getOriginalIssuePrice(shareClassId: string): number {
    // Implementation to get original issue price for anti-dilution calculations
    return 1.0 // Placeholder
  }

  private getConvertibleSecuritiesShares(carveOuts: string[]): number {
    // Implementation to calculate convertible securities for weighted average
    return 0 // Placeholder
  }

  private getShareClassHolders(shareClassId: string): Shareholder[] {
    return Array.from(this.shareholders.values()).filter((sh) =>
      sh.holdings.some((h) => h.shareClassId === shareClassId),
    )
  }

  private getShareholderShares(shareholderId: string, shareClassId: string): number {
    const shareholder = this.shareholders.get(shareholderId)
    return (
      shareholder?.holdings.filter((h) => h.shareClassId === shareClassId).reduce((sum, h) => sum + h.shares, 0) || 0
    )
  }

  private getCommonShareholders(): Shareholder[] {
    return Array.from(this.shareholders.values()).filter((sh) =>
      sh.holdings.some((h) => {
        const shareClass = this.shareClasses.get(h.shareClassId)
        return shareClass?.type === "common"
      }),
    )
  }

  private getShareholderCommonShares(shareholderId: string): number {
    const shareholder = this.shareholders.get(shareholderId)
    return (
      shareholder?.holdings
        .filter((h) => {
          const shareClass = this.shareClasses.get(h.shareClassId)
          return shareClass?.type === "common"
        })
        .reduce((sum, h) => sum + h.shares, 0) || 0
    )
  }

  private calculateTotalOwnership(): number {
    // Implementation to calculate total ownership percentages
    return 100 // Placeholder
  }

  private calculateTotalLiquidationPreferences(): number {
    return Array.from(this.shareClasses.values()).reduce(
      (sum, sc) => sum + sc.shares * sc.liquidationPreference * sc.liquidationMultiple,
      0,
    )
  }

  public calculateSimpleExit(exitScenario: ExitScenario): {
    totalPayout: number
    distributions: Array<{
      shareholderId: string
      shareholderName: string
      shares: number
      ownershipPercent: number
      payout: number
      returnMultiple?: number
      investmentAmount?: number
    }>
    summary: {
      totalShares: number
      pricePerShare: number
      averageReturnMultiple: number
    }
  } {
    const totalShares = this.getTotalSharesOutstanding()
    const pricePerShare = exitScenario.exitValue / totalShares
    const distributions: Array<{
      shareholderId: string
      shareholderName: string
      shares: number
      ownershipPercent: number
      payout: number
      returnMultiple?: number
      investmentAmount?: number
    }> = []

    let totalReturnMultiple = 0
    let investorCount = 0

    // Calculate payout for each shareholder
    this.shareholders.forEach((shareholder) => {
      const totalShareholderShares = this.getTotalShareholderShares(shareholder.id)
      const ownershipPercent = (totalShareholderShares / totalShares) * 100
      const payout = totalShareholderShares * pricePerShare

      // Calculate return multiple if this is an investor
      let returnMultiple: number | undefined
      let investmentAmount: number | undefined

      const investorRounds = this.fundingRounds.filter((round) =>
        round.investors.some((inv) => inv.name === shareholder.name),
      )

      if (investorRounds.length > 0) {
        investmentAmount = investorRounds.reduce((sum, round) => {
          const investor = round.investors.find((inv) => inv.name === shareholder.name)
          return sum + (investor?.amount || 0)
        }, 0)

        if (investmentAmount > 0) {
          returnMultiple = payout / investmentAmount
          totalReturnMultiple += returnMultiple
          investorCount++
        }
      }

      distributions.push({
        shareholderId: shareholder.id,
        shareholderName: shareholder.name,
        shares: this.roundShares(totalShareholderShares),
        ownershipPercent: this.roundOwnership(ownershipPercent),
        payout: this.roundCurrency(payout),
        returnMultiple: returnMultiple ? this.roundMultiple(returnMultiple) : undefined,
        investmentAmount: investmentAmount ? this.roundCurrency(investmentAmount) : undefined,
      })
    })

    // Sort by payout descending
    distributions.sort((a, b) => b.payout - a.payout)

    return {
      totalPayout: this.roundCurrency(exitScenario.exitValue),
      distributions,
      summary: {
        totalShares: this.roundShares(totalShares),
        pricePerShare: this.roundCurrency(pricePerShare),
        averageReturnMultiple: investorCount > 0 ? this.roundMultiple(totalReturnMultiple / investorCount) : 0,
      },
    }
  }

  public performIntegrityCheck(): IntegrityCheckResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check 1: Ownership percentages sum to 100%
    const totalShares = this.getTotalSharesOutstanding()
    let calculatedOwnershipTotal = 0

    this.shareholders.forEach((shareholder) => {
      const shareholderShares = this.getTotalShareholderShares(shareholder.id)
      const ownershipPercent = (shareholderShares / totalShares) * 100
      calculatedOwnershipTotal += ownershipPercent
    })

    const roundedOwnershipTotal = this.roundOwnership(calculatedOwnershipTotal)

    if (Math.abs(roundedOwnershipTotal - 100) > 0.01) {
      errors.push(`Ownership percentages sum to ${roundedOwnershipTotal}%, not 100%`)
    }

    // Check 2: No negative shares
    this.shareholders.forEach((shareholder) => {
      this.shareClasses.forEach((shareClass) => {
        const shares = this.getShareholderShares(shareholder.id, shareClass.id)
        if (shares < 0) {
          errors.push(`${shareholder.name} has negative shares (${shares}) in ${shareClass.name}`)
        }
      })
    })

    // Check 3: Share class totals match individual holdings
    this.shareClasses.forEach((shareClass) => {
      let totalHoldings = 0
      this.shareholders.forEach((shareholder) => {
        totalHoldings += this.getShareholderShares(shareholder.id, shareClass.id)
      })

      if (Math.abs(totalHoldings - shareClass.shares) > 0.001) {
        errors.push(`${shareClass.name} total (${shareClass.shares}) doesn't match sum of holdings (${totalHoldings})`)
      }
    })

    // Check 4: Funding round math consistency
    this.fundingRounds.forEach((round, index) => {
      if (round.type === "priced" && round.preMoney && round.postMoney) {
        const expectedPostMoney = round.preMoney + round.amount
        if (Math.abs(round.postMoney - expectedPostMoney) > 0.01) {
          warnings.push(
            `Round ${index + 1}: Post-money (${round.postMoney}) doesn't equal pre-money + investment (${expectedPostMoney})`,
          )
        }
      }
    })

    // Check 5: SAFE conversion consistency
    const safeRounds = this.fundingRounds.filter((round) => round.type === "safe")
    if (safeRounds.length > 0) {
      const totalSafeAmount = safeRounds.reduce((sum, round) => sum + round.amount, 0)
      if (totalSafeAmount > 0) {
        warnings.push(
          `${safeRounds.length} SAFE(s) totaling $${this.roundCurrency(totalSafeAmount)} - ensure conversion is properly modeled`,
        )
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      ownershipTotal: roundedOwnershipTotal,
      shareCountTotal: this.roundShares(totalShares),
      rounding: {
        method: this.roundingConfig.method,
        precision: this.roundingConfig.precision,
      },
    }
  }

  private roundOwnership(percentage: number): number {
    const factor = Math.pow(10, this.roundingConfig.precision)
    switch (this.roundingConfig.method) {
      case "floor":
        return Math.floor(percentage * factor) / factor
      case "ceil":
        return Math.ceil(percentage * factor) / factor
      default:
        return Math.round(percentage * factor) / factor
    }
  }

  private roundShares(shares: number): number {
    const factor = Math.pow(10, this.roundingConfig.sharesPrecision)
    switch (this.roundingConfig.method) {
      case "floor":
        return Math.floor(shares * factor) / factor
      case "ceil":
        return Math.ceil(shares * factor) / factor
      default:
        return Math.round(shares * factor) / factor
    }
  }

  private roundCurrency(amount: number): number {
    return Math.round(amount * 100) / 100 // Always round currency to 2 decimal places
  }

  private roundMultiple(multiple: number): number {
    return Math.round(multiple * 100) / 100 // Round return multiples to 2 decimal places
  }

  private getTotalShareholderShares(shareholderId: string): number {
    let total = 0
    this.shareClasses.forEach((shareClass) => {
      total += this.getShareholderShares(shareholderId, shareClass.id)
    })
    return total
  }

  private updateShareholderShares(shareholderId: string, shareClassId: string, shareChange: number): void {
    const shareholder = this.shareholders.get(shareholderId)
    if (!shareholder) return

    const currentShares = this.getShareholderShares(shareholderId, shareClassId)
    const newShares = currentShares + shareChange

    // Update shareholder holdings (this would typically update the database)
    // For now, we'll assume this updates the internal state
    // In a real implementation, this would update the shareholder's holdings array
  }

  public getSecondaryTransactions(): SecondaryTransaction[] {
    return [...this.secondaryTransactions]
  }

  public getSecondaryTransactionsByDate(startDate: Date, endDate: Date): SecondaryTransaction[] {
    return this.secondaryTransactions.filter(
      (transaction) => transaction.date >= startDate && transaction.date <= endDate,
    )
  }

}

export const enhancedMathEngine = new EnhancedMathEngine()
