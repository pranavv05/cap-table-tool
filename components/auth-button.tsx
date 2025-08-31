"use client" // Added client directive to fix server-side rendering error with Clerk components

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function AuthButton() {
  return (
    <>
      <SignedOut>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </SignedOut>
      <SignedIn>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
                userButtonPopoverCard: "bg-card border border-border",
                userButtonPopoverActionButton: "hover:bg-muted",
              },
            }}
            afterSignOutUrl="/"
          />
        </div>
      </SignedIn>
    </>
  )
}
