import { test, expect } from "@playwright/test"

test.describe("Funding Rounds", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication and navigate to funding rounds
    await page.goto("/funding-rounds")
  })

  test("should create a SAFE round", async ({ page }) => {
    await page.click('button:has-text("Add Funding Round")')

    // Fill round details
    await page.fill('[name="roundName"]', "Pre-Seed SAFE")
    await page.selectOption('[name="roundType"]', "SAFE")
    await page.fill('[name="investmentAmount"]', "500000")

    // SAFE specific fields
    await page.fill('[name="valuationCap"]', "5000000")
    await page.fill('[name="discountRate"]', "20")

    // Add investor
    await page.click('button:has-text("Add Investor")')
    await page.fill('[name="investors.0.name"]', "Angel Investor")
    await page.fill('[name="investors.0.amount"]', "500000")

    await page.click('button:has-text("Create Round")')

    // Should show success and new round in list
    await expect(page.locator("text=Pre-Seed SAFE")).toBeVisible()
    await expect(page.locator("text=$500,000")).toBeVisible()
  })

  test("should create a priced round", async ({ page }) => {
    await page.click('button:has-text("Add Funding Round")')

    await page.fill('[name="roundName"]', "Series A")
    await page.selectOption('[name="roundType"]', "Priced")
    await page.fill('[name="investmentAmount"]', "2000000")

    // Priced round specific fields
    await page.fill('[name="preMoneyValuation"]', "8000000")
    await page.fill('[name="liquidationPreference"]', "1")

    await page.click('button:has-text("Create Round")')

    await expect(page.locator("text=Series A")).toBeVisible()
    await expect(page.locator("text=$2,000,000")).toBeVisible()
  })
})
