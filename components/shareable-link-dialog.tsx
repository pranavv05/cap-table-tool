"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Copy, Share, Eye, EyeOff } from "lucide-react"

interface ShareableLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scenarioId: string
  scenarioName: string
}

export function ShareableLinkDialog({ open, onOpenChange, scenarioId, scenarioName }: ShareableLinkDialogProps) {
  const [permissions, setPermissions] = useState({
    canView: true,
    canComment: false,
    canEdit: false,
    requiresAuth: true,
    expiresIn: "30", // days
  })
  const [shareLink, setShareLink] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const generateShareLink = async () => {
    setIsGenerating(true)

    try {
      const response = await fetch("/api/share-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId,
          permissions,
          expiresAt: new Date(Date.now() + Number.parseInt(permissions.expiresIn) * 24 * 60 * 60 * 1000),
        }),
      })

      const data = await response.json()
      const fullLink = `${window.location.origin}/shared/${data.shareToken}`
      setShareLink(fullLink)
    } catch (error) {
      console.error("Failed to generate share link:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      // Could add toast notification here
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="h-4 w-4" />
            Share Scenario
          </DialogTitle>
          <DialogDescription>Create a shareable link for "{scenarioName}"</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Permissions</Label>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Can view</span>
                </div>
                <Switch
                  checked={permissions.canView}
                  onCheckedChange={(checked) => setPermissions((prev) => ({ ...prev, canView: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Can comment</span>
                </div>
                <Switch
                  checked={permissions.canComment}
                  onCheckedChange={(checked) => setPermissions((prev) => ({ ...prev, canComment: checked }))}
                  disabled={!permissions.canView}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Can edit</span>
                </div>
                <Switch
                  checked={permissions.canEdit}
                  onCheckedChange={(checked) => setPermissions((prev) => ({ ...prev, canEdit: checked }))}
                  disabled={!permissions.canView}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Security</Label>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Requires authentication</span>
              </div>
              <Switch
                checked={permissions.requiresAuth}
                onCheckedChange={(checked) => setPermissions((prev) => ({ ...prev, requiresAuth: checked }))}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Expires in (days)</Label>
              <Input
                type="number"
                value={permissions.expiresIn}
                onChange={(e) => setPermissions((prev) => ({ ...prev, expiresIn: e.target.value }))}
                min="1"
                max="365"
                className="w-20"
              />
            </div>
          </div>

          {shareLink ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Shareable Link</Label>
              <div className="flex gap-2">
                <Input value={shareLink} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="sm" onClick={copyToClipboard} className="shrink-0 bg-transparent">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-1 text-xs">
                <Badge variant="outline">
                  {permissions.canEdit ? "Edit" : permissions.canComment ? "Comment" : "View"}
                </Badge>
                {permissions.requiresAuth && <Badge variant="outline">Auth Required</Badge>}
                <Badge variant="outline">Expires in {permissions.expiresIn} days</Badge>
              </div>
            </div>
          ) : (
            <Button onClick={generateShareLink} disabled={isGenerating || !permissions.canView} className="w-full">
              {isGenerating ? "Generating..." : "Generate Share Link"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
