"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Sparkles, Download, Share2, RefreshCw, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface PRDData {
  id: string
  title: string
  description: string
  content: string
  edgeCases: string[]
  createdAt: string
  lastModified: string
  version: number
}

interface ChatPRDIntegrationProps {
  companyData?: any
  capTableData?: any
}

export function ChatPRDIntegration({ companyData, capTableData }: ChatPRDIntegrationProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentPRD, setCurrentPRD] = useState<PRDData | null>(null)
  const [prdHistory, setPRDHistory] = useState<PRDData[]>([])
  const [prompt, setPrompt] = useState("")
  const [prdType, setPRDType] = useState("funding-round")
  const [iterationFeedback, setIterationFeedback] = useState("")

  const prdTypes = [
    { value: "funding-round", label: "Funding Round Strategy" },
    { value: "equity-management", label: "Equity Management Process" },
    { value: "cap-table-tool", label: "Cap Table Tool Features" },
    { value: "investor-relations", label: "Investor Relations" },
    { value: "esop-program", label: "ESOP Program Design" },
    { value: "exit-strategy", label: "Exit Strategy Planning" },
  ]

  const generatePRD = async () => {
    if (!prompt.trim()) {
      toast.error("Please provide a description for your PRD")
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-prd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          prdType,
          companyData,
          capTableData,
          context: "cap-table-management",
        }),
      })

      if (!response.ok) throw new Error("Failed to generate PRD")

      const prdData = await response.json()
      setCurrentPRD(prdData)
      setPRDHistory((prev) => [prdData, ...prev])
      toast.success("PRD generated successfully!")
    } catch (error) {
      toast.error("Failed to generate PRD. Please try again.")
      console.error("PRD generation error:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const iteratePRD = async () => {
    if (!currentPRD || !iterationFeedback.trim()) {
      toast.error("Please provide feedback for iteration")
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-prd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingPRD: currentPRD,
          iterationFeedback,
          action: "iterate",
        }),
      })

      if (!response.ok) throw new Error("Failed to iterate PRD")

      const updatedPRD = await response.json()
      setCurrentPRD(updatedPRD)
      setPRDHistory((prev) => [updatedPRD, ...prev])
      setIterationFeedback("")
      toast.success("PRD updated successfully!")
    } catch (error) {
      toast.error("Failed to iterate PRD. Please try again.")
      console.error("PRD iteration error:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const exportPRD = (format: "notion" | "gdocs" | "markdown") => {
    if (!currentPRD) return

    const content = currentPRD.content
    const blob = new Blob([content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${currentPRD.title.replace(/\s+/g, "-").toLowerCase()}.${format === "markdown" ? "md" : "txt"}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success(`PRD exported as ${format.toUpperCase()}`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            ChatPRD Integration
          </CardTitle>
          <CardDescription>Generate and iterate Product Requirements Documents with AI assistance</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="generate">Generate PRD</TabsTrigger>
              <TabsTrigger value="iterate">Iterate & Refine</TabsTrigger>
              <TabsTrigger value="history">PRD History</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prd-type">PRD Type</Label>
                  <Select value={prdType} onValueChange={setPRDType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select PRD type" />
                    </SelectTrigger>
                    <SelectContent>
                      {prdTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="prompt">Describe your requirements</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe what you want to build or the problem you're solving..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button onClick={generatePRD} disabled={isGenerating || !prompt.trim()} className="w-full">
                  {isGenerating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating PRD...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate PRD
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="iterate" className="space-y-4">
              {currentPRD ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{currentPRD.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">v{currentPRD.version}</Badge>
                        <span className="text-sm text-muted-foreground">
                          Last modified: {new Date(currentPRD.lastModified).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                          {currentPRD.content.substring(0, 500)}...
                        </pre>
                      </div>
                    </CardContent>
                  </Card>

                  <div>
                    <Label htmlFor="iteration-feedback">Feedback for iteration</Label>
                    <Textarea
                      id="iteration-feedback"
                      placeholder="What would you like to change or improve in this PRD?"
                      value={iterationFeedback}
                      onChange={(e) => setIterationFeedback(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button onClick={iteratePRD} disabled={isGenerating || !iterationFeedback.trim()} className="w-full">
                    {isGenerating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Iterating PRD...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Iterate PRD
                      </>
                    )}
                  </Button>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => exportPRD("markdown")}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Markdown
                    </Button>
                    <Button variant="outline" onClick={() => exportPRD("notion")}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Export to Notion
                    </Button>
                    <Button variant="outline" onClick={() => exportPRD("gdocs")}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Export to Google Docs
                    </Button>
                  </div>

                  {currentPRD.edgeCases.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                          Edge Cases Identified
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {currentPRD.edgeCases.map((edgeCase, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Badge variant="outline" className="mt-0.5">
                                {index + 1}
                              </Badge>
                              <span className="text-sm">{edgeCase}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Generate a PRD first to start iterating</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {prdHistory.length > 0 ? (
                <div className="space-y-4">
                  {prdHistory.map((prd) => (
                    <Card key={prd.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{prd.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">v{prd.version}</Badge>
                            <Button variant="ghost" size="sm" onClick={() => setCurrentPRD(prd)}>
                              Load
                            </Button>
                          </div>
                        </div>
                        <CardDescription>Created: {new Date(prd.createdAt).toLocaleDateString()}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">{prd.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No PRDs generated yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
