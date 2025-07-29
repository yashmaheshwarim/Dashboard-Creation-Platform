export interface AdvancedDataColumn {
  name: string
  type: "string" | "number" | "date" | "boolean"
  nullable: boolean
  unique: boolean
  stats?: {
    min?: number
    max?: number
    avg?: number
    median?: number
    mode?: any
    stdDev?: number
    variance?: number
    nullCount: number
    uniqueCount: number
    outliers?: number[]
    distribution?: { [key: string]: number }
    skewness?: number
    kurtosis?: number
  }
}

export interface AdvancedQualityReport {
  totalRows: number
  totalColumns: number
  duplicateRows: number
  nullValues: number
  dataTypes: Record<string, string>
  qualityScore: number
  issues: string[]
  suggestions: string[]
  completeness: number
  consistency: number
  validity: number
  uniqueness: number
}

export interface EDAResults {
  summary: {
    shape: [number, number]
    memoryUsage: number
    dataTypes: Record<string, number>
  }
  correlations: Array<{
    column1: string
    column2: string
    correlation: number
    pValue?: number
  }>
  outliers: Array<{
    column: string
    method: string
    count: number
    values: number[]
  }>
  distributions: Array<{
    column: string
    type: string
    histogram?: Array<{ bin: string; count: number }>
    frequency?: Array<{ value: any; count: number }>
  }>
  patterns: Array<{
    type: string
    description: string
    columns: string[]
    confidence: number
  }>
}

export class EnhancedETLProcessor {
  // Enhanced data cleaning with more sophisticated techniques
  static enhancedCleanData(data: any[], columns: AdvancedDataColumn[]): any[] {
    let cleanedData = [...data]

    // 1. Handle encoding issues
    cleanedData = this.fixEncodingIssues(cleanedData)

    // 2. Standardize text data
    cleanedData = this.standardizeTextData(cleanedData, columns)

    // 3. Handle numeric anomalies
    cleanedData = this.handleNumericAnomalies(cleanedData, columns)

    // 4. Fix date inconsistencies
    cleanedData = this.standardizeDates(cleanedData, columns)

    // 5. Handle categorical data
    cleanedData = this.standardizeCategoricalData(cleanedData, columns)

    // 6. Remove or fix structural issues
    cleanedData = this.fixStructuralIssues(cleanedData, columns)

    return cleanedData
  }

  private static fixEncodingIssues(data: any[]): any[] {
    return data.map((row) => {
      const cleanedRow: any = {}
      Object.keys(row).forEach((key) => {
        let value = row[key]
        if (typeof value === "string") {
          // Fix common encoding issues
          value = value
            .replace(/â€™/g, "'")
            .replace(/â€œ/g, '"')
            .replace(/â€/g, '"')
            .replace(/â€"/g, "—")
            .replace(/Ã¡/g, "á")
            .replace(/Ã©/g, "é")
            .replace(/Ã­/g, "í")
            .replace(/Ã³/g, "ó")
            .replace(/Ãº/g, "ú")
        }
        cleanedRow[key] = value
      })
      return cleanedRow
    })
  }

  private static standardizeTextData(data: any[], columns: AdvancedDataColumn[]): any[] {
    const textColumns = columns.filter((col) => col.type === "string")

    return data.map((row) => {
      const cleanedRow = { ...row }
      textColumns.forEach((col) => {
        let value = cleanedRow[col.name]
        if (typeof value === "string") {
          // Trim whitespace
          value = value.trim()

          // Standardize case for certain patterns
          if (this.isEmailLike(value)) {
            value = value.toLowerCase()
          } else if (this.isNameLike(value)) {
            value = this.toTitleCase(value)
          }

          // Remove extra spaces
          value = value.replace(/\s+/g, " ")

          // Handle empty strings
          if (value === "") {
            value = null
          }
        }
        cleanedRow[col.name] = value
      })
      return cleanedRow
    })
  }

  private static handleNumericAnomalies(data: any[], columns: AdvancedDataColumn[]): any[] {
    const numericColumns = columns.filter((col) => col.type === "number")

    return data.map((row) => {
      const cleanedRow = { ...row }
      numericColumns.forEach((col) => {
        let value = cleanedRow[col.name]
        if (value !== null && value !== undefined) {
          // Handle string numbers
          if (typeof value === "string") {
            // Remove currency symbols and commas
            value = value.replace(/[$,€£¥]/g, "").replace(/,/g, "")

            // Handle percentages
            if (value.includes("%")) {
              value = Number.parseFloat(value.replace("%", "")) / 100
            } else {
              value = Number.parseFloat(value)
            }
          }

          // Check for invalid numbers
          if (isNaN(value) || !isFinite(value)) {
            value = null
          }
        }
        cleanedRow[col.name] = value
      })
      return cleanedRow
    })
  }

  private static standardizeDates(data: any[], columns: AdvancedDataColumn[]): any[] {
    const dateColumns = columns.filter((col) => col.type === "date")

    return data.map((row) => {
      const cleanedRow = { ...row }
      dateColumns.forEach((col) => {
        const value = cleanedRow[col.name]
        if (value !== null && value !== undefined && value !== "") {
          try {
            // Try to parse various date formats
            const date = new Date(value)
            if (!isNaN(date.getTime())) {
              cleanedRow[col.name] = date.toISOString()
            } else {
              // Try alternative parsing
              const parsedDate = this.parseAlternativeDateFormats(value)
              cleanedRow[col.name] = parsedDate ? parsedDate.toISOString() : null
            }
          } catch {
            cleanedRow[col.name] = null
          }
        }
      })
      return cleanedRow
    })
  }

  private static standardizeCategoricalData(data: any[], columns: AdvancedDataColumn[]): any[] {
    const categoricalColumns = columns.filter((col) => col.type === "string")

    // Build standardization maps for each categorical column
    const standardizationMaps: Record<string, Record<string, string>> = {}

    categoricalColumns.forEach((col) => {
      const values = data.map((row) => row[col.name]).filter((val) => val !== null && val !== undefined)
      const uniqueValues = [...new Set(values)]

      // Group similar values
      const groups: Record<string, string[]> = {}
      uniqueValues.forEach((value) => {
        const standardized = this.standardizeValue(value)
        if (!groups[standardized]) {
          groups[standardized] = []
        }
        groups[standardized].push(value)
      })

      // Create mapping
      const mapping: Record<string, string> = {}
      Object.entries(groups).forEach(([standard, variants]) => {
        // Use the most common variant as the standard
        const mostCommon = variants.reduce((a, b) =>
          values.filter((v) => v === a).length > values.filter((v) => v === b).length ? a : b,
        )
        variants.forEach((variant) => {
          mapping[variant] = mostCommon
        })
      })

      standardizationMaps[col.name] = mapping
    })

    // Apply standardization
    return data.map((row) => {
      const cleanedRow = { ...row }
      categoricalColumns.forEach((col) => {
        const value = cleanedRow[col.name]
        if (value && standardizationMaps[col.name][value]) {
          cleanedRow[col.name] = standardizationMaps[col.name][value]
        }
      })
      return cleanedRow
    })
  }

  private static fixStructuralIssues(data: any[], columns: AdvancedDataColumn[]): any[] {
    return data.filter((row) => {
      // Remove rows that are completely empty
      const nonNullValues = Object.values(row).filter((val) => val !== null && val !== undefined && val !== "")
      return nonNullValues.length > 0
    })
  }

  // Enhanced EDA (Exploratory Data Analysis)
  static performEDA(data: any[], columns: AdvancedDataColumn[]): EDAResults {
    return {
      summary: this.generateSummary(data, columns),
      correlations: this.calculateAdvancedCorrelations(data, columns),
      outliers: this.detectAdvancedOutliers(data, columns),
      distributions: this.analyzeDistributions(data, columns),
      patterns: this.detectPatterns(data, columns),
    }
  }

  private static generateSummary(data: any[], columns: AdvancedDataColumn[]) {
    const memoryUsage = JSON.stringify(data).length // Rough estimate
    const dataTypes = columns.reduce(
      (acc, col) => {
        acc[col.type] = (acc[col.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      shape: [data.length, columns.length] as [number, number],
      memoryUsage,
      dataTypes,
    }
  }

  private static calculateAdvancedCorrelations(data: any[], columns: AdvancedDataColumn[]) {
    const numericColumns = columns.filter((col) => col.type === "number")
    const correlations: Array<{ column1: string; column2: string; correlation: number }> = []

    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const col1 = numericColumns[i].name
        const col2 = numericColumns[j].name

        const pairs = data
          .map((row) => [Number(row[col1]), Number(row[col2])])
          .filter(([x, y]) => !isNaN(x) && !isNaN(y))

        if (pairs.length > 1) {
          const correlation = this.calculatePearsonCorrelation(
            pairs.map((p) => p[0]),
            pairs.map((p) => p[1]),
          )

          correlations.push({
            column1: col1,
            column2: col2,
            correlation,
          })
        }
      }
    }

    return correlations
  }

  private static detectAdvancedOutliers(data: any[], columns: AdvancedDataColumn[]) {
    const numericColumns = columns.filter((col) => col.type === "number")
    const outliers: Array<{ column: string; method: string; count: number; values: number[] }> = []

    numericColumns.forEach((col) => {
      const values = data
        .map((row) => Number(row[col.name]))
        .filter((val) => !isNaN(val))
        .sort((a, b) => a - b)

      if (values.length > 4) {
        // IQR method
        const q1 = this.percentile(values, 25)
        const q3 = this.percentile(values, 75)
        const iqr = q3 - q1
        const lowerBound = q1 - 1.5 * iqr
        const upperBound = q3 + 1.5 * iqr

        const iqrOutliers = values.filter((val) => val < lowerBound || val > upperBound)

        if (iqrOutliers.length > 0) {
          outliers.push({
            column: col.name,
            method: "IQR",
            count: iqrOutliers.length,
            values: iqrOutliers.slice(0, 10), // Limit to first 10
          })
        }

        // Z-score method
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length
        const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length)

        const zScoreOutliers = values.filter((val) => Math.abs((val - mean) / stdDev) > 3)

        if (zScoreOutliers.length > 0) {
          outliers.push({
            column: col.name,
            method: "Z-Score",
            count: zScoreOutliers.length,
            values: zScoreOutliers.slice(0, 10),
          })
        }
      }
    })

    return outliers
  }

  private static analyzeDistributions(data: any[], columns: AdvancedDataColumn[]) {
    const distributions: Array<{
      column: string
      type: string
      histogram?: Array<{ bin: string; count: number }>
      frequency?: Array<{ value: any; count: number }>
    }> = []

    columns.forEach((col) => {
      if (col.type === "number") {
        const values = data.map((row) => Number(row[col.name])).filter((val) => !isNaN(val))

        if (values.length > 0) {
          const histogram = this.createHistogram(values, 10)
          distributions.push({
            column: col.name,
            type: "numeric",
            histogram,
          })
        }
      } else if (col.type === "string") {
        const values = data.map((row) => row[col.name]).filter((val) => val !== null && val !== undefined)

        const frequency = this.createFrequencyTable(values)
        distributions.push({
          column: col.name,
          type: "categorical",
          frequency: frequency.slice(0, 20), // Top 20 most frequent
        })
      }
    })

    return distributions
  }

  private static detectPatterns(data: any[], columns: AdvancedDataColumn[]) {
    const patterns: Array<{
      type: string
      description: string
      columns: string[]
      confidence: number
    }> = []

    // Detect potential primary keys
    columns.forEach((col) => {
      if (col.unique && col.stats && col.stats.nullCount === 0) {
        patterns.push({
          type: "primary_key",
          description: `Column '${col.name}' appears to be a primary key (unique, non-null)`,
          columns: [col.name],
          confidence: 0.9,
        })
      }
    })

    // Detect potential foreign key relationships
    const stringColumns = columns.filter((col) => col.type === "string")
    for (let i = 0; i < stringColumns.length; i++) {
      for (let j = i + 1; j < stringColumns.length; j++) {
        const col1 = stringColumns[i]
        const col2 = stringColumns[j]

        const values1 = new Set(data.map((row) => row[col1.name]).filter((val) => val))
        const values2 = new Set(data.map((row) => row[col2.name]).filter((val) => val))

        const intersection = new Set([...values1].filter((x) => values2.has(x)))
        const similarity = intersection.size / Math.min(values1.size, values2.size)

        if (similarity > 0.7) {
          patterns.push({
            type: "potential_relationship",
            description: `Columns '${col1.name}' and '${col2.name}' share ${Math.round(similarity * 100)}% of values`,
            columns: [col1.name, col2.name],
            confidence: similarity,
          })
        }
      }
    }

    // Detect time series patterns
    const dateColumns = columns.filter((col) => col.type === "date")
    if (dateColumns.length > 0) {
      patterns.push({
        type: "time_series",
        description: `Dataset contains time-based data suitable for temporal analysis`,
        columns: dateColumns.map((col) => col.name),
        confidence: 0.8,
      })
    }

    return patterns
  }

  // Helper methods
  private static isEmailLike(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  private static isNameLike(value: string): boolean {
    return /^[A-Za-z\s'-]+$/.test(value) && value.split(" ").length <= 4
  }

  private static toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
  }

  private static standardizeValue(value: any): string {
    if (typeof value !== "string") return String(value)
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "")
  }

  private static parseAlternativeDateFormats(value: string): Date | null {
    const formats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
      /(\d{1,2})-(\d{1,2})-(\d{4})/, // MM-DD-YYYY
      /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
    ]

    for (const format of formats) {
      const match = value.match(format)
      if (match) {
        try {
          const date = new Date(match[0])
          if (!isNaN(date.getTime())) {
            return date
          }
        } catch {
          continue
        }
      }
    }
    return null
  }

  private static calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length)
    if (n === 0) return 0

    const sumX = x.slice(0, n).reduce((a, b) => a + b, 0)
    const sumY = y.slice(0, n).reduce((a, b) => a + b, 0)
    const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0)
    const sumY2 = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

    return denominator === 0 ? 0 : numerator / denominator
  }

  private static percentile(values: number[], p: number): number {
    const index = (p / 100) * (values.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    const weight = index % 1

    if (upper >= values.length) return values[values.length - 1]
    return values[lower] * (1 - weight) + values[upper] * weight
  }

  private static createHistogram(values: number[], bins: number): Array<{ bin: string; count: number }> {
    const min = Math.min(...values)
    const max = Math.max(...values)
    const binWidth = (max - min) / bins

    const histogram: Array<{ bin: string; count: number }> = []

    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binWidth
      const binEnd = min + (i + 1) * binWidth
      const count = values.filter((val) => val >= binStart && (i === bins - 1 ? val <= binEnd : val < binEnd)).length

      histogram.push({
        bin: `${binStart.toFixed(2)}-${binEnd.toFixed(2)}`,
        count,
      })
    }

    return histogram
  }

  private static createFrequencyTable(values: any[]): Array<{ value: any; count: number }> {
    const frequency: Record<string, number> = {}

    values.forEach((val) => {
      const key = String(val)
      frequency[key] = (frequency[key] || 0) + 1
    })

    return Object.entries(frequency)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
  }
}
