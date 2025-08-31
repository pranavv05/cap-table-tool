import { describe, it, expect, beforeEach } from "vitest"
import { EnhancedMathEngine } from "../../lib/enhanced-math-engine"

describe("SAFE Conversion Scenarios", () => {
  let mathEngine: EnhancedMathEngine

  beforeEach(() => {
    mathEngine = new EnhancedMathEngine()
  })

  describe("SAFE (Cap Only) then Priced Round", () => {
    it("should convert SAFE at valuation cap when cap is lower", () => {
      // Initial cap table with SAFE
      const capTableWithSafe = {
        totalShares: 10000000,
        shareholders: [
          { id: "founder1", name: "Founder 1", shares: 5000000, type: "founder" },
          { id: "founder2", name: "Founder 2", shares: 5000000, type: "founder" },
        ],
        safes: [
          {
            id: "safe1",
            investorName: "Angel Investor",
            amount: 500000,
            valuationCap: 4000000,
            discountRate: 0, // Cap only
            hasMfn: false,
          },
        ],
      }

      // Series A at higher valuation
      const pricedRound = {
        type: "priced" as const,
        name: "Series A",
        amount: 2000000,
        preMoney: 8000000,
        sharePrice: 0.8, // $8M / 10M shares
      }

      const result = mathEngine.convertMultipleSAFEs(capTableWithSafe.safes.map(s => ({
        amount: s.amount,
        valuationCap: s.valuationCap,
        discountRate: s.discountRate ? s.discountRate / 100 : undefined,
        hasMFN: s.hasMfn,
        conversionTrigger: "qualified_financing",
        qualifiedFinancingThreshold: pricedRound.amount,
      })), {
        ...pricedRound,
        id: "series-a",
        date: new Date(),
        leadInvestor: "Test VC",
        investors: [],
      })

      // SAFE should convert at cap price, not round price
      const capPrice = 4000000 / 10000000 // $0.40 per share
      const roundPrice = 0.8
      const conversionPrice = Math.min(capPrice, roundPrice) // Should be $0.40

      expect(conversionPrice).toBe(0.4)

      const safeShares = 500000 / conversionPrice // 1,250,000 shares
      expect(result.individualConversions[0].sharesIssued).toBeCloseTo(1250000)
      expect(result.individualConversions[0].conversionPrice).toBeCloseTo(0.4)
      expect(result.individualConversions[0].conversionMethod).toBe("valuation_cap")
    })
  })

  describe("SAFE (Discount Only) then Priced Round", () => {
    it("should convert SAFE at discount when no cap", () => {
      const capTableWithSafe = {
        totalShares: 10000000,
        shareholders: [
          { id: "founder1", name: "Founder 1", shares: 5000000, type: "founder" },
          { id: "founder2", name: "Founder 2", shares: 5000000, type: "founder" },
        ],
        safes: [
          {
            id: "safe1",
            investorName: "Angel Investor",
            amount: 250000,
            valuationCap: null, // No cap
            discountRate: 20, // 20% discount
            hasMfn: false,
          },
        ],
      }

      const pricedRound = {
        type: "priced" as const,
        name: "Series A",
        amount: 2000000,
        preMoney: 8000000,
        sharePrice: 0.8,
      }

      const result = mathEngine.convertMultipleSAFEs(capTableWithSafe.safes.map(s => ({
        amount: s.amount,
        valuationCap: s.valuationCap || undefined,
        discountRate: s.discountRate ? s.discountRate / 100 : undefined,
        hasMFN: s.hasMfn,
        conversionTrigger: "qualified_financing",
        qualifiedFinancingThreshold: pricedRound.amount,
      })), {
        ...pricedRound,
        id: "series-a",
        date: new Date(),
        leadInvestor: "Test VC",
        investors: [],
      })

      // SAFE should convert at 20% discount to round price
      const discountedPrice = 0.8 * (1 - 0.2) // $0.64 per share
      const safeShares = 250000 / discountedPrice // ~390,625 shares

      expect(result.individualConversions[0].conversionPrice).toBeCloseTo(0.64, 2)
      expect(result.individualConversions[0].sharesIssued).toBeCloseTo(390625, 0)
      expect(result.individualConversions[0].conversionMethod).toBe("discount")
    })
  })

  describe("Mixed SAFEs (Cap + Discount) then Priced Round", () => {
    it("should handle multiple SAFEs with different terms", () => {
      const capTableWithSafes = {
        totalShares: 10000000,
        shareholders: [
          { id: "founder1", name: "Founder 1", shares: 6000000, type: "founder" },
          { id: "founder2", name: "Founder 2", shares: 4000000, type: "founder" },
        ],
        safes: [
          {
            id: "safe1",
            investorName: "Angel 1",
            amount: 100000,
            valuationCap: 3000000,
            discountRate: 20,
            hasMfn: true,
          },
          {
            id: "safe2",
            investorName: "Angel 2",
            amount: 200000,
            valuationCap: 5000000,
            discountRate: 15,
            hasMfn: false,
          },
          {
            id: "safe3",
            investorName: "Angel 3",
            amount: 150000,
            valuationCap: null, // Discount only
            discountRate: 25,
            hasMfn: false,
          },
        ],
      }

      const pricedRound = {
        type: "priced" as const,
        name: "Series A",
        amount: 3000000,
        preMoney: 12000000,
        sharePrice: 1.2, // $12M / 10M shares
      }

      const result = mathEngine.convertMultipleSAFEs(capTableWithSafes.safes.map(s => ({
        amount: s.amount,
        valuationCap: s.valuationCap || undefined,
        discountRate: s.discountRate ? s.discountRate / 100 : undefined,
        hasMFN: s.hasMfn,
        conversionTrigger: "qualified_financing",
        qualifiedFinancingThreshold: pricedRound.amount,
      })), {
        ...pricedRound,
        id: "series-a",
        date: new Date(),
        leadInvestor: "Test VC",
        investors: [],
      })

      // SAFE 1: Cap ($0.30) vs Discount ($0.96) -> Cap wins
      expect(result.individualConversions[0].conversionPrice).toBeCloseTo(0.3)
      expect(result.individualConversions[0].conversionMethod).toBe("valuation_cap")

      // SAFE 2: Cap ($0.50) vs Discount ($1.02) -> Cap wins
      expect(result.individualConversions[1].conversionPrice).toBeCloseTo(0.5)
      expect(result.individualConversions[1].conversionMethod).toBe("valuation_cap")

      // SAFE 3: Discount only ($0.90)
      expect(result.individualConversions[2].conversionPrice).toBeCloseTo(0.9, 2)
      expect(result.individualConversions[2].conversionMethod).toBe("discount")

      // MFN check: SAFE 1 should get best terms (lowest price)
      const bestPrice = Math.min(...result.individualConversions.map((c) => c.conversionPrice))
      expect(result.individualConversions[0].conversionPrice).toBe(bestPrice)
    })
  })
})
