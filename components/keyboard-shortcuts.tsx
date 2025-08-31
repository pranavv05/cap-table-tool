"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Keyboard } from "lucide-react"

export function KeyboardShortcuts() {
  const [showShortcuts, setShowShortcuts] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "k":
            e.preventDefault()
            setShowShortcuts(true)
            break
          case "n":
            e.preventDefault()
            // Trigger new round dialog
            document.dispatchEvent(new CustomEvent("create-funding-round"))
            break
          case "z":
            if (e.shiftKey) {
              e.preventDefault()
              // Redo action
              document.dispatchEvent(new CustomEvent("redo-action"))
            } else {
              e.preventDefault()
              // Undo action
              document.dispatchEvent(new CustomEvent("undo-action"))
            }
            break
        }
      }

      if (e.key === "Escape") {
        setShowShortcuts(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const shortcuts = [
    { key: "⌘ + K", description: "Show keyboard shortcuts" },
    { key: "⌘ + N", description: "Create new funding round" },
    { key: "⌘ + Z", description: "Undo last action" },
    { key: "⌘ + Shift + Z", description: "Redo last action" },
    { key: "Tab", description: "Navigate between form fields" },
    { key: "Enter", description: "Submit form or confirm action" },
    { key: "Escape", description: "Close dialog or cancel action" },
  ]

  return (
    <>
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{shortcut.description}</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {shortcut.key}
                </Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
