import { test, expect } from "@playwright/test"

test.describe("Cap Table Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard")
  })

  test("should display cap table overview", async ({ page }) => {
    // Check that key metrics are displayed
    await expect(page.locator('[data-testid="total-shares"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-shareholders"]')).toBeVisible()
    await expect(page.locator('[data-testid="company-valuation"]')).toBeVisible()

    // Check that shareholders table is displayed
    await expect(page.locator("table")).toBeVisible()
    await expect(page.locator('th:has-text("Name")')).toBeVisible()
    await expect(page.locator('th:has-text("Shares")')).toBeVisible()
    await expect(page.locator('th:has-text("Ownership %")')).toBeVisible()
  })

  test("should show ownership calculations after funding round", async ({ page }) => {
    // Navigate to scenarios
    await page.click('a[href="/scenarios"]')

    // Create exit scenario
    await page.click('button:has-text("Create Scenario")')
    await page.selectOption('[name="scenarioType"]', "exit")
    await page.fill('[name="exitValue"]', "50000000")
    await page.click('button:has-text("Create Scenario")')

    // Should show calculated returns
    await expect(page.locator("text=Exit Value")).toBeVisible()
    await expect(page.locator("text=$50,000,000")).toBeVisible()
  })
})
