"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, Clock } from "lucide-react"

interface FundingTimelineProps {
  fundingRounds: any[]
}

export function FundingTimeline({ fundingRounds }: FundingTimelineProps) {
  // Sort rounds by date
  const sortedRounds = [...fundingRounds].sort((a, b) => {
    const dateA = new Date(a.closing_date || "1970-01-01").getTime()
    const dateB = new Date(b.closing_date || "1970-01-01").getTime()
    return dateB - dateA
  })

  const getRoundTypeColor = (type: string) => {
    switch (type) {
      case "seed":
        return "bg-green-100 text-green-800"
      case "series_a":
        return "bg-blue-100 text-blue-800"
      case "series_b":
        return "bg-purple-100 text-purple-800"
      case "series_c":
        return "bg-orange-100 text-orange-800"
      case "bridge":
        return "bg-yellow-100 text-yellow-800"
      case "convertible":
        return "bg-pink-100 text-pink-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funding Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedRounds.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No funding rounds to display</div>
        ) : (
          <div className="space-y-6">
            {sortedRounds.map((round, index) => (
              <div key={round.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {round.is_completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : round.closing_date ? (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900">{round.round_name}</h4>
                    <Badge variant="secondary" className={`text-xs ${getRoundTypeColor(round.round_type)}`}>
                      {round.round_type.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>${(round.total_investment / 1000000).toFixed(1)}M raised</div>
                    {round.post_money_valuation && (
                      <div>${(round.post_money_valuation / 1000000).toFixed(1)}M post-money</div>
                    )}
                    {round.lead_investor && <div>Led by {round.lead_investor}</div>}
                    <div className="text-xs text-gray-400">
                      {round.closing_date ? new Date(round.closing_date).toLocaleDateString() : "Date TBD"}
                    </div>
                  </div>
                </div>
                {index < sortedRounds.length - 1 && <div className="absolute left-[22px] mt-8 w-0.5 h-6 bg-gray-200" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
