export interface ImputationStrategy {
  column: string
  method: "mean" | "median" | "mode" | "forward_fill" | "backward_fill" | "interpolation" | "custom"
  customValue?: any
}

export interface ImputationResult {
  originalNullCount: number
  imputedCount: number
  method: string
  success: boolean
  error?: string
}

export class DataImputation {
  // Main imputation function
  static imputeMissingData(
    data: Record<string, any>[],
    columns: any[],
    strategies: ImputationStrategy[],
  ): {
    imputedData: Record<string, any>[]
    results: Record<string, ImputationResult>
  } {
    const imputedData = [...data]
    const results: Record<string, ImputationResult> = {}

    strategies.forEach((strategy) => {
      const column = columns.find((col) => col.name === strategy.column)
      if (!column) return

      const originalNullCount = this.countNullValues(data, strategy.column)

      try {
        switch (strategy.method) {
          case "mean":
            this.imputeWithMean(imputedData, strategy.column)
            break
          case "median":
            this.imputeWithMedian(imputedData, strategy.column)
            break
          case "mode":
            this.imputeWithMode(imputedData, strategy.column)
            break
          case "forward_fill":
            this.imputeWithForwardFill(imputedData, strategy.column)
            break
          case "backward_fill":
            this.imputeWithBackwardFill(imputedData, strategy.column)
            break
          case "interpolation":
            this.imputeWithInterpolation(imputedData, strategy.column)
            break
          case "custom":
            this.imputeWithCustomValue(imputedData, strategy.column, strategy.customValue)
            break
        }

        const finalNullCount = this.countNullValues(imputedData, strategy.column)

        results[strategy.column] = {
          originalNullCount,
          imputedCount: originalNullCount - finalNullCount,
          method: strategy.method,
          success: true,
        }
      } catch (error) {
        results[strategy.column] = {
          originalNullCount,
          imputedCount: 0,
          method: strategy.method,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    })

    return { imputedData, results }
  }

  // Count null values in a column
  private static countNullValues(data: Record<string, any>[], column: string): number {
    return data.filter(
      (row) =>
        row[column] === null ||
        row[column] === undefined ||
        row[column] === "" ||
        (typeof row[column] === "string" && row[column].trim() === ""),
    ).length
  }

  // Mean imputation for numeric columns
  private static imputeWithMean(data: Record<string, any>[], column: string): void {
    const validValues = data
      .map((row) => row[column])
      .filter((val) => val !== null && val !== undefined && val !== "" && !isNaN(Number(val)))
      .map(Number)

    if (validValues.length === 0) return

    const mean = validValues.reduce((sum, val) => sum + val, 0) / validValues.length

    data.forEach((row) => {
      if (this.isNullOrEmpty(row[column])) {
        row[column] = mean
      }
    })
  }

  // Median imputation for numeric columns
  private static imputeWithMedian(data: Record<string, any>[], column: string): void {
    const validValues = data
      .map((row) => row[column])
      .filter((val) => val !== null && val !== undefined && val !== "" && !isNaN(Number(val)))
      .map(Number)
      .sort((a, b) => a - b)

    if (validValues.length === 0) return

    const median =
      validValues.length % 2 === 0
        ? (validValues[validValues.length / 2 - 1] + validValues[validValues.length / 2]) / 2
        : validValues[Math.floor(validValues.length / 2)]

    data.forEach((row) => {
      if (this.isNullOrEmpty(row[column])) {
        row[column] = median
      }
    })
  }

  // Mode imputation for categorical columns
  private static imputeWithMode(data: Record<string, any>[], column: string): void {
    const validValues = data.map((row) => row[column]).filter((val) => val !== null && val !== undefined && val !== "")

    if (validValues.length === 0) return

    // Count frequencies
    const frequencies: Record<string, number> = {}
    validValues.forEach((val) => {
      const key = String(val)
      frequencies[key] = (frequencies[key] || 0) + 1
    })

    // Find mode (most frequent value)
    const mode = Object.entries(frequencies).sort(([, a], [, b]) => b - a)[0][0]

    data.forEach((row) => {
      if (this.isNullOrEmpty(row[column])) {
        row[column] = mode
      }
    })
  }

  // Forward fill imputation
  private static imputeWithForwardFill(data: Record<string, any>[], column: string): void {
    let lastValidValue: any = null

    data.forEach((row) => {
      if (!this.isNullOrEmpty(row[column])) {
        lastValidValue = row[column]
      } else if (lastValidValue !== null) {
        row[column] = lastValidValue
      }
    })
  }

  // Backward fill imputation
  private static imputeWithBackwardFill(data: Record<string, any>[], column: string): void {
    let nextValidValue: any = null

    // First pass: find next valid values
    for (let i = data.length - 1; i >= 0; i--) {
      if (!this.isNullOrEmpty(data[i][column])) {
        nextValidValue = data[i][column]
      } else if (nextValidValue !== null) {
        data[i][column] = nextValidValue
      }
    }
  }

  // Linear interpolation for numeric time series
  private static imputeWithInterpolation(data: Record<string, any>[], column: string): void {
    const numericData = data.map((row, index) => ({
      index,
      value: this.isNullOrEmpty(row[column]) ? null : Number(row[column]),
    }))

    for (let i = 0; i < numericData.length; i++) {
      if (numericData[i].value === null) {
        // Find previous and next valid values
        let prevIndex = i - 1
        let nextIndex = i + 1

        while (prevIndex >= 0 && numericData[prevIndex].value === null) {
          prevIndex--
        }

        while (nextIndex < numericData.length && numericData[nextIndex].value === null) {
          nextIndex++
        }

        if (prevIndex >= 0 && nextIndex < numericData.length) {
          // Linear interpolation
          const prevValue = numericData[prevIndex].value!
          const nextValue = numericData[nextIndex].value!
          const steps = nextIndex - prevIndex
          const stepSize = (nextValue - prevValue) / steps

          data[i][column] = prevValue + stepSize * (i - prevIndex)
        }
      }
    }
  }

  // Custom value imputation
  private static imputeWithCustomValue(data: Record<string, any>[], column: string, customValue: any): void {
    data.forEach((row) => {
      if (this.isNullOrEmpty(row[column])) {
        row[column] = customValue
      }
    })
  }

  // Helper function to check if value is null or empty
  private static isNullOrEmpty(value: any): boolean {
    return value === null || value === undefined || value === "" || (typeof value === "string" && value.trim() === "")
  }

  // Get recommended imputation strategies based on column types
  static getRecommendedStrategies(columns: any[]): ImputationStrategy[] {
    return columns
      .filter((col) => col.stats && col.stats.nullCount > 0)
      .map((col) => {
        let method: ImputationStrategy["method"] = "mode"

        switch (col.type) {
          case "number":
            method = col.stats.uniqueCount > 10 ? "mean" : "median"
            break
          case "string":
            method = "mode"
            break
          case "date":
            method = "forward_fill"
            break
          case "boolean":
            method = "mode"
            break
        }

        return {
          column: col.name,
          method,
        }
      })
  }
}
