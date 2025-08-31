import { describe, it, expect } from "vitest"
import { calculateOwnershipPercentages, calculateDilution } from "../../lib/post-round-calculations"

describe("Cap Table Calculations", () => {
  describe("calculateOwnershipPercentages", () => {
    it("should calculate correct ownership percentages for founders", () => {
      const shareholders = [
        { id: "1", name: "Founder 1", shares: 7000000, type: "founder" },
        { id: "2", name: "Founder 2", shares: 3000000, type: "founder" },
      ]
      const totalShares = 10000000

      const result = calculateOwnershipPercentages(shareholders, totalShares)

      expect(result[0].ownershipPercentage).toBe(70)
      expect(result[1].ownershipPercentage).toBe(30)
    })

    it("should handle ESOP pool correctly", () => {
      const shareholders = [
        { id: "1", name: "Founder 1", shares: 6000000, type: "founder" },
        { id: "2", name: "ESOP Pool", shares: 2000000, type: "esop" },
        { id: "3", name: "Investor 1", shares: 2000000, type: "investor" },
      ]
      const totalShares = 10000000

      const result = calculateOwnershipPercentages(shareholders, totalShares)

      expect(result[0].ownershipPercentage).toBe(60)
      expect(result[1].ownershipPercentage).toBe(20)
      expect(result[2].ownershipPercentage).toBe(20)
    })
  })

  describe("calculateDilution", () => {
    it("should calculate dilution correctly after funding round", () => {
      const preRoundShares = 8000000
      const newInvestment = 2000000
      const sharePrice = 1

      const result = calculateDilution(preRoundShares, newInvestment, sharePrice)

      expect(result.dilutionPercentage).toBe(20)
      expect(result.postRoundShares).toBe(10000000)
    })
  })
})
