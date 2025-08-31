import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { OnboardingForm } from "../../../components/onboarding-form"

// Mock the router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock the API call
vi.mock("../../../app/api/companies/route", () => ({
  POST: vi.fn(),
}))

describe("OnboardingForm", () => {
  it("should render the first step correctly", () => {
    render(<OnboardingForm userId="test-user-id" />)

    expect(screen.getByText("Company Information")).toBeInTheDocument()
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
    // Incorporation date is in step 2, not step 1
    expect(screen.queryByLabelText(/incorporation date/i)).not.toBeInTheDocument()
  })

  it("should progress from step 1 to step 2", async () => {
    const user = userEvent.setup()
    render(<OnboardingForm userId="test-user-id" />)

    // Fill out company information (step 1)
    await user.type(screen.getByLabelText(/company name/i), "Test Company")

    // Click next to go to step 2
    await user.click(screen.getByText("Next"))

    // Should be on legal structure step (step 2)
    await waitFor(() => {
      expect(screen.getByText("Legal Structure")).toBeInTheDocument()
      // Check for incorporation date button (it's a button, not an input)
      expect(screen.getByText(/pick a date/i)).toBeInTheDocument()
    })
  })

  it("should validate required fields", async () => {
    const user = userEvent.setup()
    render(<OnboardingForm userId="test-user-id" />)

    // Try to proceed without filling required fields
    const nextButton = screen.getByText("Next")
    
    // Button should be disabled when company name is empty
    expect(nextButton).toBeDisabled()
    
    // Fill company name
    await user.type(screen.getByLabelText(/company name/i), "Test Company")
    
    // Now button should be enabled
    expect(nextButton).toBeEnabled()
  })

  it("should display step indicators", () => {
    render(<OnboardingForm userId="test-user-id" />)
    
    // Check that step indicators are present
    expect(screen.getByText("Company Information")).toBeInTheDocument()
    expect(screen.getByText("Basic details about your company")).toBeInTheDocument()
    
    // Verify that we start on step 1
    const nextButton = screen.getByText("Next")
    expect(nextButton).toBeInTheDocument()
    
    const previousButton = screen.getByText("Previous")
    expect(previousButton).toBeDisabled()
  })
})
