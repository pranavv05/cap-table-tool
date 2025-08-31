/**
 * Export utilities for Cap Table data
 * Supports CSV and PDF export functionality
 */

import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Type definitions for cap table data
export interface Company {
  id: string
  name: string
  legal_name: string
  incorporation_date: string
  total_authorized_shares: number
  par_value: number
}

export interface Shareholder {
  id: string
  name: string
  email: string
  shareholder_type: string
  equity_grants: EquityGrant[]
}

export interface EquityGrant {
  id: string
  grant_type: string
  shares_granted: number
  exercise_price: number
  vesting_schedule: any
  is_active: boolean
}

export interface FundingRound {
  id: string
  round_name: string
  round_type: string
  investment_amount: number
  pre_money_valuation?: number
  post_money_valuation?: number
  closing_date: string
  terms: any
}

export interface OwnershipData {
  name: string
  value: number
  color: string
  shares: number
}

export interface ExportData {
  company: Company
  shareholders: Shareholder[]
  equityGrants: EquityGrant[]
  fundingRounds: FundingRound[]
  ownershipData: OwnershipData[]
  totalShares: number
  totalRaised: number
  currentValuation: number
}

/**
 * Converts data to CSV format
 */
function arrayToCSV(data: any[]): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        if (value === null || value === undefined) return ''
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return String(value)
      }).join(',')
    )
  ].join('\n')
  
  return csvContent
}

/**
 * Downloads CSV file with given content
 */
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Export ownership summary as CSV
 */
export function exportOwnershipCSV(data: ExportData): void {
  const ownershipRows = data.ownershipData.map(item => ({
    'Stakeholder Type': item.name,
    'Ownership Percentage': `${item.value.toFixed(2)}%`,
    'Number of Shares': item.shares.toLocaleString(),
    'Share Value': `$${((data.currentValuation * item.value / 100) / 1000000).toFixed(2)}M`
  }))

  // Add summary row
  const summaryRow = {
    'Stakeholder Type': 'TOTAL',
    'Ownership Percentage': '100.00%',
    'Number of Shares': data.totalShares.toLocaleString(),
    'Share Value': `$${(data.currentValuation / 1000000).toFixed(2)}M`
  }

  const csvContent = arrayToCSV([...ownershipRows, summaryRow])
  const filename = `${data.company.name.replace(/\s+/g, '_')}_ownership_${new Date().toISOString().split('T')[0]}.csv`
  
  downloadCSV(csvContent, filename)
}

/**
 * Export detailed shareholder information as CSV
 */
export function exportShareholdersCSV(data: ExportData): void {
  const shareholderRows: any[] = []
  
  data.shareholders.forEach(shareholder => {
    shareholder.equity_grants.forEach(grant => {
      shareholderRows.push({
        'Shareholder Name': shareholder.name,
        'Email': shareholder.email,
        'Type': shareholder.shareholder_type,
        'Grant Type': grant.grant_type,
        'Shares Granted': grant.shares_granted.toLocaleString(),
        'Exercise Price': `$${grant.exercise_price.toFixed(4)}`,
        'Grant Value': `$${(grant.shares_granted * grant.exercise_price).toLocaleString()}`,
        'Status': grant.is_active ? 'Active' : 'Inactive',
        'Ownership %': data.totalShares > 0 ? `${((grant.shares_granted / data.totalShares) * 100).toFixed(4)}%` : '0%'
      })
    })
  })

  const csvContent = arrayToCSV(shareholderRows)
  const filename = `${data.company.name.replace(/\s+/g, '_')}_shareholders_${new Date().toISOString().split('T')[0]}.csv`
  
  downloadCSV(csvContent, filename)
}

/**
 * Export funding rounds as CSV
 */
export function exportFundingRoundsCSV(data: ExportData): void {
  const fundingRows = data.fundingRounds.map(round => ({
    'Round Name': round.round_name,
    'Round Type': round.round_type,
    'Investment Amount': `$${(round.investment_amount / 1000000).toFixed(2)}M`,
    'Pre-Money Valuation': round.pre_money_valuation ? `$${(round.pre_money_valuation / 1000000).toFixed(2)}M` : 'N/A',
    'Post-Money Valuation': round.post_money_valuation ? `$${(round.post_money_valuation / 1000000).toFixed(2)}M` : 'N/A',
    'Closing Date': new Date(round.closing_date).toLocaleDateString(),
    'Dilution %': round.pre_money_valuation && round.post_money_valuation 
      ? `${((round.investment_amount / round.post_money_valuation) * 100).toFixed(2)}%` 
      : 'N/A'
  }))

  // Add summary row
  const summaryRow = {
    'Round Name': 'TOTAL RAISED',
    'Round Type': 'Summary',
    'Investment Amount': `$${(data.totalRaised / 1000000).toFixed(2)}M`,
    'Pre-Money Valuation': '',
    'Post-Money Valuation': `$${(data.currentValuation / 1000000).toFixed(2)}M`,
    'Closing Date': '',
    'Dilution %': ''
  }

  const csvContent = arrayToCSV([...fundingRows, summaryRow])
  const filename = `${data.company.name.replace(/\s+/g, '_')}_funding_rounds_${new Date().toISOString().split('T')[0]}.csv`
  
  downloadCSV(csvContent, filename)
}

/**
 * Export complete cap table as CSV
 */
export function exportCompleteCapTableCSV(data: ExportData): void {
  // Create comprehensive cap table data
  const capTableRows: any[] = []
  
  // Add company header information
  capTableRows.push({
    'Entity': 'COMPANY INFORMATION',
    'Name': data.company.name,
    'Legal Name': data.company.legal_name,
    'Incorporation Date': new Date(data.company.incorporation_date).toLocaleDateString(),
    'Authorized Shares': data.company.total_authorized_shares.toLocaleString(),
    'Par Value': `$${data.company.par_value.toFixed(4)}`,
    'Current Valuation': `$${(data.currentValuation / 1000000).toFixed(2)}M`,
    'Total Raised': `$${(data.totalRaised / 1000000).toFixed(2)}M`
  })

  // Add empty row for separation
  capTableRows.push({})

  // Add ownership summary
  capTableRows.push({
    'Entity': 'OWNERSHIP BREAKDOWN',
    'Name': '',
    'Legal Name': '',
    'Incorporation Date': '',
    'Authorized Shares': '',
    'Par Value': '',
    'Current Valuation': '',
    'Total Raised': ''
  })

  data.ownershipData.forEach(item => {
    capTableRows.push({
      'Entity': item.name,
      'Name': '',
      'Legal Name': '',
      'Incorporation Date': '',
      'Authorized Shares': item.shares.toLocaleString(),
      'Par Value': `${item.value.toFixed(2)}%`,
      'Current Valuation': `$${((data.currentValuation * item.value / 100) / 1000000).toFixed(2)}M`,
      'Total Raised': ''
    })
  })

  // Add empty row for separation
  capTableRows.push({})

  // Add detailed shareholder information
  capTableRows.push({
    'Entity': 'DETAILED SHAREHOLDERS',
    'Name': '',
    'Legal Name': '',
    'Incorporation Date': '',
    'Authorized Shares': '',
    'Par Value': '',
    'Current Valuation': '',
    'Total Raised': ''
  })

  data.shareholders.forEach(shareholder => {
    const totalShares = shareholder.equity_grants.reduce((sum, grant) => sum + grant.shares_granted, 0)
    const ownershipPercent = data.totalShares > 0 ? (totalShares / data.totalShares) * 100 : 0
    
    capTableRows.push({
      'Entity': shareholder.name,
      'Name': shareholder.email,
      'Legal Name': shareholder.shareholder_type,
      'Incorporation Date': '',
      'Authorized Shares': totalShares.toLocaleString(),
      'Par Value': `${ownershipPercent.toFixed(4)}%`,
      'Current Valuation': `$${((data.currentValuation * ownershipPercent / 100) / 1000000).toFixed(2)}M`,
      'Total Raised': ''
    })
  })

  const csvContent = arrayToCSV(capTableRows)
  const filename = `${data.company.name.replace(/\s+/g, '_')}_complete_cap_table_${new Date().toISOString().split('T')[0]}.csv`
  
  downloadCSV(csvContent, filename)
}

/**
 * PDF Export Functions
 */

/**
 * Downloads PDF file with given content
 */
function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename)
}

/**
 * Generate PDF header with company information
 */
function addPDFHeader(doc: jsPDF, company: Company): number {
  const pageWidth = doc.internal.pageSize.width
  let yPosition = 20

  // Company name
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(company.name, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 10

  // Legal name
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Legal Name: ${company.legal_name}`, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 8

  // Report info
  doc.setFontSize(10)
  doc.text(`Cap Table Report - Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 15

  // Add line separator
  doc.setLineWidth(0.5)
  doc.line(20, yPosition, pageWidth - 20, yPosition)
  yPosition += 10

  return yPosition
}

/**
 * Export ownership summary as PDF
 */
export function exportOwnershipPDF(data: ExportData): void {
  const doc = new jsPDF()
  let yPosition = addPDFHeader(doc, data.company)

  // Title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Ownership Summary', 20, yPosition)
  yPosition += 15

  // Prepare table data
  const headers = ['Stakeholder Type', 'Ownership %', 'Shares', 'Value']
  const rows = data.ownershipData.map(item => [
    item.name,
    `${item.value.toFixed(2)}%`,
    item.shares.toLocaleString(),
    `$${((data.currentValuation * item.value / 100) / 1000000).toFixed(2)}M`
  ])

  // Add total row
  rows.push([
    'TOTAL',
    '100.00%',
    data.totalShares.toLocaleString(),
    `$${(data.currentValuation / 1000000).toFixed(2)}M`
  ])

  // Add table
  ;(doc as any).autoTable({
    head: [headers],
    body: rows,
    startY: yPosition,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [64, 64, 64],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    }
  })

  const filename = `${data.company.name.replace(/\s+/g, '_')}_ownership_${new Date().toISOString().split('T')[0]}.pdf`
  downloadPDF(doc, filename)
}

/**
 * Export detailed shareholder information as PDF
 */
export function exportShareholdersPDF(data: ExportData): void {
  const doc = new jsPDF()
  let yPosition = addPDFHeader(doc, data.company)

  // Title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Detailed Shareholders', 20, yPosition)
  yPosition += 15

  // Prepare table data
  const headers = ['Name', 'Type', 'Grant Type', 'Shares', 'Exercise Price', 'Ownership %']
  const rows: any[] = []
  
  data.shareholders.forEach(shareholder => {
    shareholder.equity_grants.forEach(grant => {
      rows.push([
        shareholder.name,
        shareholder.shareholder_type,
        grant.grant_type,
        grant.shares_granted.toLocaleString(),
        `$${grant.exercise_price.toFixed(4)}`,
        data.totalShares > 0 ? `${((grant.shares_granted / data.totalShares) * 100).toFixed(4)}%` : '0%'
      ])
    })
  })

  // Add table
  ;(doc as any).autoTable({
    head: [headers],
    body: rows,
    startY: yPosition,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [64, 64, 64],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 20 }
    }
  })

  const filename = `${data.company.name.replace(/\s+/g, '_')}_shareholders_${new Date().toISOString().split('T')[0]}.pdf`
  downloadPDF(doc, filename)
}

/**
 * Export funding rounds as PDF
 */
export function exportFundingRoundsPDF(data: ExportData): void {
  const doc = new jsPDF()
  let yPosition = addPDFHeader(doc, data.company)

  // Title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Funding History', 20, yPosition)
  yPosition += 15

  // Prepare table data
  const headers = ['Round', 'Type', 'Investment', 'Pre-Money', 'Post-Money', 'Date']
  const rows = data.fundingRounds.map(round => [
    round.round_name,
    round.round_type,
    `$${(round.investment_amount / 1000000).toFixed(2)}M`,
    round.pre_money_valuation ? `$${(round.pre_money_valuation / 1000000).toFixed(2)}M` : 'N/A',
    round.post_money_valuation ? `$${(round.post_money_valuation / 1000000).toFixed(2)}M` : 'N/A',
    new Date(round.closing_date).toLocaleDateString()
  ])

  // Add summary row
  rows.push([
    'TOTAL',
    'Summary',
    `$${(data.totalRaised / 1000000).toFixed(2)}M`,
    '',
    `$${(data.currentValuation / 1000000).toFixed(2)}M`,
    ''
  ])

  // Add table
  ;(doc as any).autoTable({
    head: [headers],
    body: rows,
    startY: yPosition,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [64, 64, 64],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    }
  })

  const filename = `${data.company.name.replace(/\s+/g, '_')}_funding_rounds_${new Date().toISOString().split('T')[0]}.pdf`
  downloadPDF(doc, filename)
}

/**
 * Export complete cap table as PDF
 */
export function exportCompleteCapTablePDF(data: ExportData): void {
  const doc = new jsPDF()
  let yPosition = addPDFHeader(doc, data.company)

  // Company Overview
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Company Overview', 20, yPosition)
  yPosition += 10

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Authorized Shares: ${data.company.total_authorized_shares.toLocaleString()}`, 20, yPosition)
  yPosition += 6
  doc.text(`Total Issued: ${data.totalShares.toLocaleString()}`, 20, yPosition)
  yPosition += 6
  doc.text(`Par Value: $${data.company.par_value.toFixed(4)}`, 20, yPosition)
  yPosition += 6
  doc.text(`Current Valuation: $${(data.currentValuation / 1000000).toFixed(2)}M`, 20, yPosition)
  yPosition += 6
  doc.text(`Total Raised: $${(data.totalRaised / 1000000).toFixed(2)}M`, 20, yPosition)
  yPosition += 15

  // Ownership Summary
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Ownership Summary', 20, yPosition)
  yPosition += 10

  const ownershipHeaders = ['Stakeholder Type', 'Shares', 'Ownership %', 'Value']
  const ownershipRows = data.ownershipData.map(item => [
    item.name,
    item.shares.toLocaleString(),
    `${item.value.toFixed(2)}%`,
    `$${((data.currentValuation * item.value / 100) / 1000000).toFixed(2)}M`
  ])

  ;(doc as any).autoTable({
    head: [ownershipHeaders],
    body: ownershipRows,
    startY: yPosition,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [64, 64, 64],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    }
  })

  // Get final Y position after table
  yPosition = (doc as any).lastAutoTable.finalY + 20

  // Check if we need a new page
  if (yPosition > doc.internal.pageSize.height - 60) {
    doc.addPage()
    yPosition = 20
  }

  // Funding History
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Funding History', 20, yPosition)
  yPosition += 10

  if (data.fundingRounds.length > 0) {
    const fundingHeaders = ['Round', 'Type', 'Investment', 'Pre-Money', 'Post-Money', 'Date']
    const fundingRows = data.fundingRounds.map(round => [
      round.round_name,
      round.round_type,
      `$${(round.investment_amount / 1000000).toFixed(2)}M`,
      round.pre_money_valuation ? `$${(round.pre_money_valuation / 1000000).toFixed(2)}M` : 'N/A',
      round.post_money_valuation ? `$${(round.post_money_valuation / 1000000).toFixed(2)}M` : 'N/A',
      new Date(round.closing_date).toLocaleDateString()
    ])

    ;(doc as any).autoTable({
      head: [fundingHeaders],
      body: fundingRows,
      startY: yPosition,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [64, 64, 64],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      }
    })
  } else {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.text('No funding rounds recorded.', 20, yPosition)
  }

  const filename = `${data.company.name.replace(/\s+/g, '_')}_complete_cap_table_${new Date().toISOString().split('T')[0]}.pdf`
  downloadPDF(doc, filename)
}