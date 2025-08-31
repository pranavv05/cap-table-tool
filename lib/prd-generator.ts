interface PRDGenerationRequest {
  prompt: string
  prdType: string
  companyData?: any
  capTableData?: any
  context?: string
  existingPRD?: any
  iterationFeedback?: string
  action?: "generate" | "iterate"
}

interface PRDTemplate {
  title: string
  sections: string[]
  edgeCasePrompts: string[]
}

const PRD_TEMPLATES: Record<string, PRDTemplate> = {
  "funding-round": {
    title: "Funding Round Strategy PRD",
    sections: [
      "Executive Summary",
      "Business Objectives",
      "Funding Requirements",
      "Use of Funds",
      "Market Analysis",
      "Financial Projections",
      "Risk Assessment",
      "Timeline & Milestones",
      "Success Metrics",
    ],
    edgeCasePrompts: [
      "What if funding takes longer than expected?",
      "How to handle over-subscription or under-subscription?",
      "What if market conditions change during fundraising?",
      "How to manage existing investor relations during new rounds?",
    ],
  },
  "equity-management": {
    title: "Equity Management Process PRD",
    sections: [
      "Overview",
      "Stakeholder Management",
      "Equity Allocation Framework",
      "Vesting Schedules",
      "Option Pool Management",
      "Compliance Requirements",
      "Reporting & Analytics",
      "Integration Requirements",
      "Security & Access Control",
    ],
    edgeCasePrompts: [
      "How to handle early employee departures?",
      "What about equity adjustments for performance?",
      "How to manage equity during acquisitions?",
      "What if founders disagree on equity splits?",
    ],
  },
  "cap-table-tool": {
    title: "Cap Table Tool Features PRD",
    sections: [
      "Product Vision",
      "User Personas",
      "Core Features",
      "User Experience",
      "Technical Requirements",
      "Integration Capabilities",
      "Security & Compliance",
      "Performance Requirements",
      "Success Metrics",
    ],
    edgeCasePrompts: [
      "How to handle complex securities like convertible notes?",
      "What about multi-class share structures?",
      "How to manage international equity structures?",
      "What if users need to import from other cap table tools?",
    ],
  },
  "investor-relations": {
    title: "Investor Relations Strategy PRD",
    sections: [
      "IR Objectives",
      "Stakeholder Mapping",
      "Communication Strategy",
      "Reporting Framework",
      "Meeting Cadence",
      "Information Sharing",
      "Feedback Collection",
      "Relationship Management",
      "Success Metrics",
    ],
    edgeCasePrompts: [
      "How to handle difficult investor conversations?",
      "What about conflicting investor interests?",
      "How to manage information asymmetry?",
      "What if company performance is below expectations?",
    ],
  },
  "esop-program": {
    title: "ESOP Program Design PRD",
    sections: [
      "Program Objectives",
      "Eligibility Criteria",
      "Grant Types & Structures",
      "Vesting Schedules",
      "Exercise Mechanisms",
      "Tax Implications",
      "Administration Process",
      "Communication Plan",
      "Success Metrics",
    ],
    edgeCasePrompts: [
      "How to handle option grants for remote employees?",
      "What about early exercise provisions?",
      "How to manage option pool dilution?",
      "What if employees leave before vesting?",
    ],
  },
  "exit-strategy": {
    title: "Exit Strategy Planning PRD",
    sections: [
      "Exit Objectives",
      "Valuation Framework",
      "Potential Acquirers",
      "Due Diligence Preparation",
      "Stakeholder Alignment",
      "Timeline & Process",
      "Legal Considerations",
      "Tax Optimization",
      "Success Metrics",
    ],
    edgeCasePrompts: [
      "What if multiple exit opportunities arise simultaneously?",
      "How to handle founder disagreements on exit timing?",
      "What about employee retention during exit process?",
      "How to manage confidentiality during negotiations?",
    ],
  },
}

export function generatePRDPrompt(request: PRDGenerationRequest): string {
  const template = PRD_TEMPLATES[request.prdType]

  if (request.action === "iterate" && request.existingPRD) {
    return `
Please iterate on the following PRD based on the feedback provided:

EXISTING PRD:
${request.existingPRD.content}

FEEDBACK FOR ITERATION:
${request.iterationFeedback}

Please update the PRD to address the feedback while maintaining the overall structure and quality. Focus on:
1. Addressing the specific feedback points
2. Improving clarity and detail where needed
3. Ensuring consistency throughout the document
4. Identifying any new edge cases that arise from the changes

Return the updated PRD in markdown format with clear sections and professional language.
`
  }

  const contextInfo = request.companyData
    ? `
COMPANY CONTEXT:
- Company: ${request.companyData.name}
- Industry: ${request.companyData.industry}
- Stage: ${request.companyData.stage}
- Total Shares: ${request.companyData.total_shares}
`
    : ""

  const capTableInfo = request.capTableData
    ? `
CAP TABLE CONTEXT:
- Number of Shareholders: ${request.capTableData.shareholders?.length || 0}
- Funding Rounds: ${request.capTableData.fundingRounds?.length || 0}
- Latest Valuation: ${request.capTableData.fundingRounds?.[request.capTableData.fundingRounds.length - 1]?.post_money_valuation || "Not available"}
`
    : ""

  return `
You are an expert product manager and startup advisor. Generate a comprehensive Product Requirements Document (PRD) for: ${template.title}

USER REQUEST:
${request.prompt}

${contextInfo}
${capTableInfo}

Please create a detailed PRD that includes the following sections:
${template.sections.map((section) => `- ${section}`).join("\n")}

For each section, provide:
1. Clear objectives and requirements
2. Specific details and specifications
3. Success criteria and metrics
4. Implementation considerations

Also identify potential edge cases and challenges, particularly around:
${template.edgeCasePrompts.map((prompt) => `- ${prompt}`).join("\n")}

Format the response as a professional markdown document with clear headings, bullet points, and actionable content. Make it comprehensive but concise, suitable for engineering and business stakeholders.

Focus on practical implementation details and real-world considerations based on the company context provided.
`
}

export function extractEdgeCases(prdContent: string): string[] {
  const edgeCaseSection = prdContent.match(/## Edge Cases[\s\S]*?(?=##|$)/i)
  if (!edgeCaseSection) return []

  const edgeCases = edgeCaseSection[0]
    .split("\n")
    .filter((line) => line.trim().startsWith("-") || line.trim().startsWith("*"))
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter((line) => line.length > 0)

  return edgeCases.slice(0, 10) // Limit to 10 edge cases
}

export function generatePRDId(): string {
  return `prd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
