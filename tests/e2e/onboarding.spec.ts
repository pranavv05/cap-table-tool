import { test, expect } from "@playwright/test"

test.describe("Onboarding Flow", () => {
  test("should complete full onboarding process", async ({ page }) => {
    await page.goto("/")

    // Click Get Started button
    await page.click("text=Get Started")

    // Should redirect to sign-up (or onboarding if already signed in)
    await expect(page).toHaveURL(/\/(sign-up|onboarding)/)

    // If on sign-up, we'll mock the auth flow
    if (page.url().includes("sign-up")) {
      // In a real test, you'd handle the actual sign-up flow
      // For now, we'll navigate directly to onboarding
      await page.goto("/onboarding")
    }

    // Step 1: Company Information
    await expect(page.locator("h2")).toContainText("Company Information")

    await page.fill('[name="companyName"]', "Test Startup Inc.")
    await page.fill('[name="incorporationDate"]', "2024-01-01")
    await page.selectOption('[name="jurisdiction"]', "Delaware")
    await page.click('button:has-text("Next")')

    // Step 2: Founder Setup
    await expect(page.locator("h2")).toContainText("Founder Setup")

    // Select 2 founders
    await page.click('button:has-text("2")')

    // Fill founder details
    await page.fill('[name="founders.0.name"]', "John Doe")
    await page.fill('[name="founders.0.email"]', "john@teststartup.com")
    await page.fill('[name="founders.1.name"]', "Jane Smith")
    await page.fill('[name="founders.1.email"]', "jane@teststartup.com")

    // Set equity split
    await page.click("text=Percentage")
    await page.fill('[name="founders.0.equity"]', "60")
    await page.fill('[name="founders.1.equity"]', "40")

    await page.click('button:has-text("Next")')

    // Step 3: Legal Structure
    await expect(page.locator("h2")).toContainText("Legal Structure")

    await page.selectOption('[name="entityType"]', "C-Corporation")
    await page.fill('[name="authorizedShares"]', "10000000")
    await page.fill('[name="parValue"]', "0.001")

    await page.click('button:has-text("Next")')

    // Step 4: Review
    await expect(page.locator("h2")).toContainText("Review & Submit")

    // Verify information is displayed correctly
    await expect(page.locator("text=Test Startup Inc.")).toBeVisible()
    await expect(page.locator("text=John Doe")).toBeVisible()
    await expect(page.locator("text=Jane Smith")).toBeVisible()

    // Submit
    await page.click('button:has-text("Create Company")')

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard")
    await expect(page.locator("h1")).toContainText("Dashboard")
  })

  test("should validate required fields", async ({ page }) => {
    await page.goto("/onboarding")

    // Try to proceed without filling required fields
    await page.click('button:has-text("Next")')

    // Should show validation errors
    await expect(page.locator("text=Company name is required")).toBeVisible()
  })
})
