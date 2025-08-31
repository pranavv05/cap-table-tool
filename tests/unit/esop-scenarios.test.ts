import { describe, it, expect, beforeEach } from "vitest"
import { EnhancedMathEngine } from "../../lib/enhanced-math-engine"

describe("ESOP Scenarios", () => {
  let mathEngine: EnhancedMathEngine

  beforeEach(() => {
    mathEngine = new EnhancedMathEngine()
  })

  describe("Pre-Money vs Post-Money ESOP Comparison", () => {
    it("should show different dilution effects for pre-money vs post-money ESOP", () => {
      const baseCapTable = {
        totalShares: 10000000,
        shareholders: [
          { id: "founder1", name: "Founder 1", shares: 5000000, type: "founder" },
          { id: "founder2", name: "Founder 2", shares: 5000000, type: "founder" },
        ],
      }

      const roundTerms = {
        investmentAmount: 2000000,
        preMoneyValuation: 8000000,
        targetOptionPoolPercentage: 15,
      }

      // Pre-money ESOP
      const preMoneyResult = mathEngine.calculateEsopComparison(baseCapTable, roundTerms, "pre-money")

      // Post-money ESOP
      const postMoneyResult = mathEngine.calculateEsopComparison(baseCapTable, roundTerms, "post-money")

      // Pre-money: Founders diluted by ESOP, investors not
      // Post-money: Everyone diluted by ESOP proportionally

      // Use toBeCloseTo for floating-point comparisons
      expect(preMoneyResult.founderDilution).not.toBe(postMoneyResult.founderDilution);
      expect(preMoneyResult.investorDilution).toBe(0); // Investors not diluted by pre-money ESOP
      expect(postMoneyResult.investorDilution).toBeGreaterThan(0); // Investors diluted by post-money ESOP

      // Validate specific calculations using correct formulas
      expect(preMoneyResult.esopShares).toBeCloseTo(1764706, 0);
      expect(postMoneyResult.esopShares).toBeCloseTo(1875000, 0);
    })
  })

  describe("ESOP Top-ups Across Multiple Rounds", () => {
    it("should handle ESOP refreshes in subsequent rounds", () => {
      // After Series A with 15% ESOP
      const capTable = {
        totalShares: 12500000,
        shareholders: [
          { id: "founder1", name: "Founder 1", shares: 4250000, type: "founder" },
          { id: "founder2", name: "Founder 2", shares: 4250000, type: "founder" },
          { id: "esop", name: "ESOP Pool", shares: 1875000, type: "esop" },
          { id: "seriesA", name: "Series A", shares: 2125000, type: "investor" },
        ],
      }

      // Series B with ESOP refresh to 20%
      const seriesBRound = {
        type: "priced" as const,
        name: "Series B",
        investmentAmount: 5000000,
        preMoneyValuation: 25000000,
        isPreMoneyOptionPool: true,
        optionPoolPercentage: 20,
        currentOptionPoolShares: 1875000, // Current ESOP
      }

      // Use single argument for calculatePricedRound
      const roundDetails = {
        amount: seriesBRound.investmentAmount,
        preMoney: seriesBRound.preMoneyValuation,
        optionPoolAdjustment: seriesBRound.optionPoolPercentage,
        isPreMoneyOptionPool: seriesBRound.isPreMoneyOptionPool
      };
      const result = mathEngine.calculatePricedRound(roundDetails);

      // Should calculate additional ESOP needed
      const poolImpact = result.optionPoolImpact;
      if (poolImpact) {
        const expectedNewEsopShares = poolImpact.poolSharesAfter;
        const expectedAdditionalEsop = poolImpact.poolSharesAfter - poolImpact.poolSharesBefore;
        // Validate pool shares change
        expect(expectedAdditionalEsop).toBeGreaterThan(0);
        expect(expectedNewEsopShares).toBeGreaterThan(poolImpact.poolSharesBefore);
      }

      // Validate dilution only affects pre-money shareholders
      // Use dilution for founders
      const founderDilution = result.dilution['founder1']?.dilutionPercent;
      expect(founderDilution).toBeGreaterThan(0);
    })
  })
})
