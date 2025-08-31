"use client"

import { Button } from "@/components/ui/button"
import { UserButton } from "@clerk/nextjs"
import { Building2, Download, Plus, Settings } from "lucide-react"
import Link from "next/link"

interface DashboardHeaderProps {
  company: {
    id: string
    name: string
    company_type: string
  }
}

export function DashboardHeader({ company }: DashboardHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{company.name}</h1>
                <p className="text-sm text-gray-500">{company.company_type}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Shareholder
            </Button>
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  )
}
