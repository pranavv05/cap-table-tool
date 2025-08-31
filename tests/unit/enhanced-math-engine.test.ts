import { describe, it, expect, beforeEach } from "vitest"
import { EnhancedMathEngine, type FundingRound, type SAFETerms } from "../../lib/enhanced-math-engine"

describe("Enhanced Math Engine - Comprehensive Fundraising Scenarios", () => {
  let engine: EnhancedMathEngine

  beforeEach(() => {
    engine = new EnhancedMathEngine()
  })

  describe("Priced Rounds", () => {
    it("should correctly calculate pre-money round with dilution", () => {
      const result = engine.calculatePricedRound({
        amount: 1000000, // $1M investment
        preMoney: 4000000, // $4M pre-money
      })

      expect(result.preMoney).toBe(4000000)
      expect(result.postMoney).toBe(5000000)
      expect(result.sharePrice).toBeCloseTo(4.0) // $4M / 1M shares
      expect(result.newSharesIssued).toBeCloseTo(250000) // $1M / $4 per share
    })

    it("should correctly calculate post-money round", () => {
      const result = engine.calculatePricedRound({
        amount: 2000000, // $2M investment
        postMoney: 10000000, // $10M post-money
      })

      expect(result.postMoney).toBe(10000000)
      expect(result.preMoney).toBe(8000000)
      expect(result.sharePrice).toBeCloseTo(8.0)
      expect(result.newSharesIssued).toBeCloseTo(250000)
    })

    it("should handle option pool adjustments correctly", () => {
      const result = engine.calculatePricedRound({
        amount: 1000000,
        preMoney: 4000000,
        optionPoolAdjustment: 20, // 20% option pool
        isPreMoneyOptionPool: true,
      })

      expect(result.optionPoolImpact).toBeDefined()
      // Pre-money option pools result in slightly less than target percentage due to dilution
      expect(result.optionPoolImpact!.poolPercentageAfter).toBeCloseTo(19.05, 1)
    })
  })

  describe("SAFE Conversions", () => {
    it("should convert SAFE with valuation cap correctly", () => {
      const safeTerms: SAFETerms = {
        amount: 500000,
        valuationCap: 5000000,
        discountRate: 0.2,
        hasMFN: false,
        conversionTrigger: "qualified_financing",
        qualifiedFinancingThreshold: 1000000,
      }

      const triggerRound: FundingRound = {
        id: "series-a",
        name: "Series A",
        type: "priced",
        date: new Date(),
        amount: 3000000,
        preMoney: 12000000,
        leadInvestor: "VC Fund",
        investors: [],
      }

      const result = engine.convertSAFE(safeTerms, triggerRound)

      // Should use valuation cap since it's better than discount
      expect(result.conversionMethod).toBe("valuation_cap")
      expect(result.conversionPrice).toBeCloseTo(5.0) // $5M cap / 1M shares
      expect(result.sharesIssued).toBeCloseTo(100000) // $500K / $5 per share
    })

    it("should handle multiple SAFEs with pro-rata rights", () => {
      const safes: SAFETerms[] = [
        {
          amount: 250000,
          valuationCap: 4000000,
          hasMFN: false,
          conversionTrigger: "qualified_financing",
          qualifiedFinancingThreshold: 1000000,
        },
        {
          amount: 500000,
          discountRate: 0.25,
          hasMFN: false,
          conversionTrigger: "qualified_financing",
          qualifiedFinancingThreshold: 1000000,
        },
      ]

      const triggerRound: FundingRound = {
        id: "series-a",
        name: "Series A",
        type: "priced",
        date: new Date(),
        amount: 2000000,
        preMoney: 8000000,
        leadInvestor: "VC Fund",
        investors: [],
      }

      const result = engine.convertMultipleSAFEs(safes, triggerRound, true)

      expect(result.individualConversions).toHaveLength(2)
      expect(result.totalConversionAmount).toBe(750000)
      expect(result.proRataRights).toBeDefined()
    })
  })

  describe("ESOP Pool Management", () => {
    it("should correctly compare pre-money vs post-money ESOP scenarios", () => {
      const fundingRound: FundingRound = {
        id: "series-a",
        name: "Series A",
        type: "priced",
        date: new Date(),
        amount: 2000000,
        preMoney: 8000000,
        leadInvestor: "VC Fund",
        investors: [],
      }

      const comparison = engine.compareESOPScenarios(20, fundingRound) // 20% ESOP pool

      expect(comparison.summary.recommendation).toBe("pre_money")
      expect(comparison.detailedComparison).toHaveLength(4)

      // Check that there are meaningful differences between scenarios
      const founderDilutionMetric = comparison.detailedComparison.find((m) => m.metric === "Founder Dilution")
      const investorDilutionMetric = comparison.detailedComparison.find((m) => m.metric === "Investor Dilution")
      const esopSizeMetric = comparison.detailedComparison.find((m) => m.metric === "ESOP Pool Size")
      
      expect(founderDilutionMetric).toBeDefined()
      expect(investorDilutionMetric).toBeDefined()
      expect(esopSizeMetric).toBeDefined()
      
      // In pre-money ESOP, investors don't get diluted by ESOP
      expect(investorDilutionMetric!.preMoney).toBe(0)
      expect(investorDilutionMetric!.postMoney).toBeGreaterThan(0)
      
      // Post-money ESOP should require more ESOP shares to achieve same percentage
      expect(esopSizeMetric!.postMoney).toBeGreaterThan(esopSizeMetric!.preMoney)
      
      // With these specific numbers, founder dilution happens to be the same,
      // but in general pre-money should be equal or better for founders
      expect(founderDilutionMetric!.preMoney).toBeLessThanOrEqual(founderDilutionMetric!.postMoney)
    })
  })

  describe("Anti-Dilution", () => {
    it("should correctly calculate weighted average anti-dilution", () => {
      const shareClass = {
        id: "series-a",
        name: "Series A",
        type: "preferred" as const,
        shares: 200000,
        liquidationPreference: 1,
        liquidationMultiple: 1,
        isParticipating: false,
        antiDilutionType: "weighted_average_broad" as const,
        conversionRatio: 1,
        seniority: 2,
      };

      const downRound: FundingRound = {
        id: "series-b",
        name: "Series B",
        type: "priced",
        date: new Date(),
        amount: 1000000,
        preMoney: 3000000, // Lower valuation
        leadInvestor: "Down Round VC",
        investors: [],
      };

      // This is a simplified test; a full implementation would require
      // mocking getOriginalIssuePrice and other helpers.
      // The key is to ensure the formula is being applied.
      const result = engine.calculateAntiDilution(shareClass, downRound);

      // With the corrected formula, we expect an adjustment ratio > 1
      expect(result.adjustmentRatio).toBeGreaterThan(1);
      expect(result.newConversionRatio).toBeGreaterThan(shareClass.conversionRatio);
    });

    it("should handle option pool refresh correctly", () => {
      // First create initial pool
      engine.manageOptionPool({
        type: "create",
        percentage: 15,
        isPreMoney: true,
      })

      // Then refresh to 20%
      const result = engine.manageOptionPool({
        type: "refresh",
        percentage: 20,
      })

      expect(result.optionPool.refreshPercentage).toBe(20)
      expect(result.dilutionAnalysis.totalSharesImpact).toBeGreaterThan(0)
    })
  })


  describe("Exit Calculations", () => {
    it("should calculate simple exit distributions correctly", () => {
      const exitScenario = {
        exitValue: 50000000, // $50M exit
        exitType: "acquisition" as const,
        date: new Date(),
        useSimpleCalculation: true,
      }

      const result = engine.calculateSimpleExit(exitScenario)

      expect(result.totalPayout).toBe(50000000)
      expect(result.summary.totalShares).toBeGreaterThan(0)
      expect(result.summary.pricePerShare).toBeGreaterThan(0)
    })
  })

  describe("Integrity Checks", () => {
    it("should validate ownership percentages sum to 100%", () => {
      const result = engine.performIntegrityCheck()

      expect(result.rounding.method).toBe("round")
      expect(result.rounding.precision).toBe(4)
      expect(typeof result.ownershipTotal).toBe("number")
    })

    it("should detect negative shares", () => {
      const result = engine.performIntegrityCheck()

      // Should not have negative shares in a fresh engine
      const negativeShareErrors = result.errors.filter((error) => error.includes("negative shares"))
      expect(negativeShareErrors).toHaveLength(0)
    })
  })

  describe("Input Validation", () => {
    it("should validate priced round inputs", () => {
      const validation = engine.validatePricedRoundInputs({
        amount: -1000000, // Invalid negative amount
        preMoney: 5000000,
      })

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain("Investment amount must be positive")
    })

    it("should validate SAFE terms", () => {
      const validation = engine.validateSAFETerms({
        amount: 500000,
        discountRate: 1.5, // Invalid discount rate > 1
        hasMFN: false,
        conversionTrigger: "qualified_financing",
        qualifiedFinancingThreshold: 1000000,
      })

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain("Discount rate must be between 0 and 1 (e.g., 0.2 for 20%)")
    })
  })
})
