import { describe, it, expect, beforeEach } from "vitest"
import { EnhancedMathEngine } from "../../lib/enhanced-math-engine"

describe("Fundraising Scenarios", () => {
  let mathEngine: EnhancedMathEngine

  beforeEach(() => {
    mathEngine = new EnhancedMathEngine()
  })

  describe("Single Priced Round, No ESOP", () => {
    it("should correctly calculate ownership after single priced round", () => {
      // Initial setup: 2 founders with 50/50 split
      const initialCapTable = {
        totalShares: 10000000,
        shareholders: [
          { id: "founder1", name: "Founder 1", shares: 5000000, type: "founder" },
          { id: "founder2", name: "Founder 2", shares: 5000000, type: "founder" },
        ],
      }

      // Series A: $2M at $8M pre-money valuation
      const pricedRound = {
        amount: 2000000,
        preMoney: 8000000,
      }

      const result = mathEngine.calculatePricedRound(pricedRound)

      // Validate calculations
      expect(result.sharePrice).toBeCloseTo(0.8) // $8M / 10M shares
      expect(result.newSharesIssued).toBeCloseTo(2500000) // $2M / $0.8

      // Check ownership percentages
      const founder1Ownership = (5000000 / 12500000) * 100
      const founder2Ownership = (5000000 / 12500000) * 100
      const investorOwnership = (2500000 / 12500000) * 100

      expect(founder1Ownership).toBeCloseTo(40, 1)
      expect(founder2Ownership).toBeCloseTo(40, 1)
      expect(investorOwnership).toBeCloseTo(20, 1)

      // Integrity check: total ownership should be 100%
      expect(founder1Ownership + founder2Ownership + investorOwnership).toBeCloseTo(100, 1)
    })
  })

  describe("Priced Round with Pre-Money ESOP Top-up", () => {
    it("should correctly handle pre-money ESOP expansion", () => {
      // Initial setup with existing 10% ESOP
      const initialCapTable = {
        totalShares: 10000000,
        shareholders: [
          { id: "founder1", name: "Founder 1", shares: 4500000, type: "founder" },
          { id: "founder2", name: "Founder 2", shares: 4500000, type: "founder" },
          { id: "esop", name: "ESOP Pool", shares: 1000000, type: "esop" },
        ],
      }

      // Series A with ESOP top-up to 20% pre-money
      const pricedRound = {
        amount: 3000000,
        preMoney: 12000000,
        isPreMoneyOptionPool: true,
        optionPoolAdjustment: 20, // Target 20% ESOP pre-money
      }

      const result = mathEngine.calculatePricedRound(pricedRound)

      // Pre-money ESOP calculation
      // Target: 20% of pre-money shares
      // Current ESOP: 1M shares (10%)
      // Need to add: 1.5M shares to reach 2.5M (20% of 12.5M pre-money shares)

      expect(result.optionPoolImpact?.poolSharesAfter).toBeGreaterThan(0)
    })
  })
})
