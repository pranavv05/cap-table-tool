"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Plus, Edit, Trash2 } from "lucide-react"

interface RecentActivityProps {
  companyId: string
}

// Mock data - in real app this would come from audit logs
const mockActivities = [
  {
    id: 1,
    action: "Added shareholder",
    description: "John Doe added as founder",
    timestamp: "2 hours ago",
    type: "create",
  },
  {
    id: 2,
    action: "Updated equity grant",
    description: "Modified vesting schedule for Jane Smith",
    timestamp: "1 day ago",
    type: "update",
  },
  {
    id: 3,
    action: "Created funding round",
    description: "Series A round initiated",
    timestamp: "3 days ago",
    type: "create",
  },
  {
    id: 4,
    action: "Exported cap table",
    description: "Cap table exported to Excel",
    timestamp: "1 week ago",
    type: "export",
  },
]

export function RecentActivity({ companyId }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "create":
        return <Plus className="h-4 w-4 text-green-600" />
      case "update":
        return <Edit className="h-4 w-4 text-blue-600" />
      case "delete":
        return <Trash2 className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case "create":
        return "bg-green-100 text-green-800"
      case "update":
        return "bg-blue-100 text-blue-800"
      case "delete":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <Badge variant="secondary" className={`text-xs ${getActivityBadgeColor(activity.type)}`}>
                    {activity.type}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
