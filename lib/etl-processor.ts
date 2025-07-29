import Papa from "papaparse"
import * as XLSX from "xlsx"

export interface DataColumn {
  name: string
  type: "string" | "number" | "date" | "boolean"
  nullable: boolean
  unique: boolean
  stats?: {
    min?: number
    max?: number
    avg?: number
    nullCount: number
    uniqueCount: number
  }
}

export interface DataQualityReport {
  totalRows: number
  totalColumns: number
  duplicateRows: number
  nullValues: number
  dataTypes: Record<string, string>
  qualityScore: number
  issues: string[]
  suggestions: string[]
}

export interface ProcessedData {
  data: Record<string, any>[]
  columns: DataColumn[]
  qualityReport: DataQualityReport
  originalRowCount: number
  cleanedRowCount: number
}

export class ETLProcessor {
  // Extract data from different file formats
  static async extractData(file: File): Promise<{ data: any[]; headers: string[] }> {
    const fileExtension = file.name.split(".").pop()?.toLowerCase()

    switch (fileExtension) {
      case "csv":
        return this.extractFromCSV(file)
      case "xlsx":
      case "xls":
        return this.extractFromExcel(file)
      case "json":
        return this.extractFromJSON(file)
      default:
        throw new Error(`Unsupported file format: ${fileExtension}`)
    }
  }

  private static async extractFromCSV(file: File): Promise<{ data: any[]; headers: string[] }> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing error: ${results.errors[0].message}`))
          } else {
            resolve({
              data: results.data as any[],
              headers: results.meta.fields || [],
            })
          }
        },
        error: (error) => reject(error),
      })
    })
  }

  private static async extractFromExcel(file: File): Promise<{ data: any[]; headers: string[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: "array" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

          if (jsonData.length === 0) {
            reject(new Error("Excel file is empty"))
            return
          }

          const headers = jsonData[0] as string[]
          const rows = jsonData.slice(1).map((row) => {
            const obj: any = {}
            headers.forEach((header, index) => {
              obj[header] = (row as any[])[index] || null
            })
            return obj
          })

          resolve({ data: rows, headers })
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error("Failed to read Excel file"))
      reader.readAsArrayBuffer(file)
    })
  }

  private static async extractFromJSON(file: File): Promise<{ data: any[]; headers: string[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string)
          const data = Array.isArray(jsonData) ? jsonData : [jsonData]
          const headers = data.length > 0 ? Object.keys(data[0]) : []
          resolve({ data, headers })
        } catch (error) {
          reject(new Error("Invalid JSON format"))
        }
      }
      reader.onerror = () => reject(new Error("Failed to read JSON file"))
      reader.readAsText(file)
    })
  }

  // Transform and clean data
  static transformData(rawData: any[], headers: string[]): ProcessedData {
    const originalRowCount = rawData.length
    let cleanedData = [...rawData]

    // Step 1: Remove completely empty rows
    cleanedData = cleanedData.filter((row) =>
      Object.values(row).some((value) => value !== null && value !== undefined && value !== ""),
    )

    // Step 2: Detect and convert data types
    const columns = this.detectDataTypes(cleanedData, headers)

    // Step 3: Clean and standardize data
    cleanedData = this.cleanData(cleanedData, columns)

    // Step 4: Remove duplicates
    const { data: deduplicatedData, duplicateCount } = this.removeDuplicates(cleanedData)

    // Step 5: Generate quality report
    const qualityReport = this.generateQualityReport(deduplicatedData, columns, originalRowCount, duplicateCount)

    return {
      data: deduplicatedData,
      columns,
      qualityReport,
      originalRowCount,
      cleanedRowCount: deduplicatedData.length,
    }
  }

  private static detectDataTypes(data: any[], headers: string[]): DataColumn[] {
    return headers.map((header) => {
      const values = data.map((row) => row[header]).filter((val) => val !== null && val !== undefined && val !== "")
      const nullCount = data.length - values.length
      const uniqueValues = new Set(values)

      let type: "string" | "number" | "date" | "boolean" = "string"

      // Check if boolean
      if (
        values.every(
          (val) => typeof val === "boolean" || val === "true" || val === "false" || val === "1" || val === "0",
        )
      ) {
        type = "boolean"
      }
      // Check if number
      else if (values.every((val) => !isNaN(Number(val)) && val !== "")) {
        type = "number"
      }
      // Check if date
      else if (values.every((val) => !isNaN(Date.parse(val)))) {
        type = "date"
      }

      const stats =
        type === "number"
          ? {
              min: Math.min(...values.map(Number)),
              max: Math.max(...values.map(Number)),
              avg: values.reduce((sum, val) => sum + Number(val), 0) / values.length,
              nullCount,
              uniqueCount: uniqueValues.size,
            }
          : {
              nullCount,
              uniqueCount: uniqueValues.size,
            }

      return {
        name: header,
        type,
        nullable: nullCount > 0,
        unique: uniqueValues.size === values.length,
        stats,
      }
    })
  }

  private static cleanData(data: any[], columns: DataColumn[]): any[] {
    return data.map((row) => {
      const cleanedRow: any = {}

      columns.forEach((column) => {
        const value = row[column.name]

        // Handle null/undefined/empty values
        if (value === null || value === undefined || value === "") {
          cleanedRow[column.name] = null
          return
        }

        // Convert based on detected type
        switch (column.type) {
          case "number":
            const numValue = Number(value)
            cleanedRow[column.name] = isNaN(numValue) ? null : numValue
            break
          case "boolean":
            if (typeof value === "boolean") {
              cleanedRow[column.name] = value
            } else {
              cleanedRow[column.name] = value === "true" || value === "1" || value === 1
            }
            break
          case "date":
            const dateValue = new Date(value)
            cleanedRow[column.name] = isNaN(dateValue.getTime()) ? null : dateValue.toISOString()
            break
          default:
            // String - trim whitespace and standardize
            cleanedRow[column.name] = String(value).trim()
        }
      })

      return cleanedRow
    })
  }

  private static removeDuplicates(data: any[]): { data: any[]; duplicateCount: number } {
    const seen = new Set()
    const uniqueData: any[] = []
    let duplicateCount = 0

    data.forEach((row) => {
      const key = JSON.stringify(row)
      if (!seen.has(key)) {
        seen.add(key)
        uniqueData.push(row)
      } else {
        duplicateCount++
      }
    })

    return { data: uniqueData, duplicateCount }
  }

  private static generateQualityReport(
    data: any[],
    columns: DataColumn[],
    originalRowCount: number,
    duplicateCount: number,
  ): DataQualityReport {
    const totalRows = data.length
    const totalColumns = columns.length
    const nullValues = columns.reduce((sum, col) => sum + (col.stats?.nullCount || 0), 0)

    const issues: string[] = []
    const suggestions: string[] = []

    // Analyze data quality issues
    if (duplicateCount > 0) {
      issues.push(`Found ${duplicateCount} duplicate rows`)
      suggestions.push("Consider reviewing data source for duplicate entries")
    }

    if (nullValues > totalRows * totalColumns * 0.1) {
      issues.push(`High number of missing values (${nullValues})`)
      suggestions.push("Consider data imputation or additional data collection")
    }

    columns.forEach((col) => {
      if (col.stats && col.stats.nullCount > totalRows * 0.5) {
        issues.push(`Column "${col.name}" has >50% missing values`)
        suggestions.push(`Consider removing or imputing values for column "${col.name}"`)
      }
    })

    // Calculate quality score (0-100)
    let qualityScore = 100
    qualityScore -= (duplicateCount / originalRowCount) * 20
    qualityScore -= (nullValues / (totalRows * totalColumns)) * 30
    qualityScore -= issues.length * 5
    qualityScore = Math.max(0, Math.min(100, qualityScore))

    return {
      totalRows,
      totalColumns,
      duplicateRows: duplicateCount,
      nullValues,
      dataTypes: columns.reduce(
        (acc, col) => {
          acc[col.name] = col.type
          return acc
        },
        {} as Record<string, string>,
      ),
      qualityScore: Math.round(qualityScore),
      issues,
      suggestions,
    }
  }

  // Load data into structured format for visualization
  static loadForVisualization(processedData: ProcessedData) {
    const { data, columns } = processedData

    // Generate summary statistics
    const summaryStats = columns.map((column) => {
      if (column.type === "number" && column.stats) {
        return {
          column: column.name,
          type: column.type,
          min: column.stats.min,
          max: column.stats.max,
          avg: column.stats.avg,
          nullCount: column.stats.nullCount,
          uniqueCount: column.stats.uniqueCount,
        }
      }
      return {
        column: column.name,
        type: column.type,
        nullCount: column.stats?.nullCount || 0,
        uniqueCount: column.stats?.uniqueCount || 0,
      }
    })

    // Generate chart-ready data
    const chartData = this.generateChartData(data, columns)

    return {
      rawData: data,
      summaryStats,
      chartData,
      columns,
    }
  }

  private static generateChartData(data: any[], columns: DataColumn[]) {
    const numericColumns = columns.filter((col) => col.type === "number")
    const categoricalColumns = columns.filter((col) => col.type === "string")
    const dateColumns = columns.filter((col) => col.type === "date")

    const chartData: any = {}

    // Time series data
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      const dateCol = dateColumns[0].name
      const valueCol = numericColumns[0].name

      chartData.timeSeries = data
        .filter((row) => row[dateCol] && row[valueCol] !== null)
        .sort((a, b) => new Date(a[dateCol]).getTime() - new Date(b[dateCol]).getTime())
        .map((row) => ({
          date: new Date(row[dateCol]).toLocaleDateString(),
          value: row[valueCol],
        }))
    }

    // Category distribution
    if (categoricalColumns.length > 0) {
      const catCol = categoricalColumns[0].name
      const distribution: Record<string, number> = {}

      data.forEach((row) => {
        const category = row[catCol]
        if (category) {
          distribution[category] = (distribution[category] || 0) + 1
        }
      })

      chartData.categoryDistribution = Object.entries(distribution)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10) // Top 10 categories
    }

    // Numeric correlations
    if (numericColumns.length >= 2) {
      const col1 = numericColumns[0].name
      const col2 = numericColumns[1].name

      chartData.correlation = data
        .filter((row) => row[col1] !== null && row[col2] !== null)
        .map((row) => ({
          x: row[col1],
          y: row[col2],
        }))
    }

    return chartData
  }
}
