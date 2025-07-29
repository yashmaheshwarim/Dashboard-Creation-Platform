"use client"

import { useState, useMemo } from "react"
import { TrendingUp, Activity, Brain, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useDataStore } from "@/hooks/use-data-store"

export default function AnalyticsPage() {
  const { completedDatasets } = useDataStore()
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("")
  const [analysisType, setAnalysisType] = useState<string>("correlation")

  const selectedDataset = useMemo(() => {
    if (!selectedDatasetId) return completedDatasets[0]
    return completedDatasets.find((d) => d.id === selectedDatasetId) || completedDatasets[0]
  }, [selectedDatasetId, completedDatasets])

  // Advanced Analytics Functions
  const calculateCorrelationMatrix = () => {
    if (!selectedDataset?.visualizationData) return []

    const numericColumns = selectedDataset.processedData?.columns.filter((col) => col.type === "number") || []
    const data = selectedDataset.visualizationData.rawData

    const correlations: any[] = []

    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const col1 = numericColumns[i].name
        const col2 = numericColumns[j].name

        const values1 = data.map((row) => Number(row[col1])).filter((val) => !isNaN(val))
        const values2 = data.map((row) => Number(row[col2])).filter((val) => !isNaN(val))

        if (values1.length > 1 && values2.length > 1) {
          const correlation = calculatePearsonCorrelation(values1, values2)
          correlations.push({
            x: col1,
            y: col2,
            correlation: correlation,
            strength: Math.abs(correlation) > 0.7 ? "Strong" : Math.abs(correlation) > 0.3 ? "Moderate" : "Weak",
          })
        }
      }
    }

    return correlations
  }

  const calculatePearsonCorrelation = (x: number[], y: number[]) => {
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

  const detectOutliers = () => {
    if (!selectedDataset?.visualizationData) return []

    const numericColumns = selectedDataset.processedData?.columns.filter((col) => col.type === "number") || []
    const data = selectedDataset.visualizationData.rawData
    const outliers: any[] = []

    numericColumns.forEach((column) => {
      const values = data
        .map((row) => Number(row[column.name]))
        .filter((val) => !isNaN(val))
        .sort((a, b) => a - b)

      if (values.length > 4) {
        const q1 = values[Math.floor(values.length * 0.25)]
        const q3 = values[Math.floor(values.length * 0.75)]
        const iqr = q3 - q1
        const lowerBound = q1 - 1.5 * iqr
        const upperBound = q3 + 1.5 * iqr

        const columnOutliers = values.filter((val) => val < lowerBound || val > upperBound)

        if (columnOutliers.length > 0) {
          outliers.push({
            column: column.name,
            count: columnOutliers.length,
            percentage: ((columnOutliers.length / values.length) * 100).toFixed(1),
            range: `${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)}`,
            outlierValues: columnOutliers.slice(0, 5), // Show first 5 outliers
          })
        }
      }
    })

    return outliers
  }

  const generateTrendAnalysis = () => {
    if (!selectedDataset?.visualizationData) return []

    const dateColumns = selectedDataset.processedData?.columns.filter((col) => col.type === "date") || []
    const numericColumns = selectedDataset.processedData?.columns.filter((col) => col.type === "number") || []
    const data = selectedDataset.visualizationData.rawData

    if (dateColumns.length === 0 || numericColumns.length === 0) return []

    const dateCol = dateColumns[0].name
    const trends: any[] = []

    numericColumns.forEach((numCol) => {
      const timeSeriesData = data
        .filter((row) => row[dateCol] && row[numCol.name] !== null)
        .map((row) => ({
          date: new Date(row[dateCol]),
          value: Number(row[numCol.name]),
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime())

      if (timeSeriesData.length > 2) {
        // Simple linear trend calculation
        const n = timeSeriesData.length
        const sumX = timeSeriesData.reduce((sum, point, index) => sum + index, 0)
        const sumY = timeSeriesData.reduce((sum, point) => sum + point.value, 0)
        const sumXY = timeSeriesData.reduce((sum, point, index) => sum + index * point.value, 0)
        const sumX2 = timeSeriesData.reduce((sum, point, index) => sum + index * index, 0)

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
        const direction = slope > 0 ? "Increasing" : slope < 0 ? "Decreasing" : "Stable"
        const strength = Math.abs(slope) > 1 ? "Strong" : Math.abs(slope) > 0.1 ? "Moderate" : "Weak"

        trends.push({
          column: numCol.name,
          direction,
          strength,
          slope: slope.toFixed(4),
          dataPoints: timeSeriesData.length,
        })
      }
    })

    return trends
  }

  const correlations = calculateCorrelationMatrix()
  const outliers = detectOutliers()
  const trends = generateTrendAnalysis()

  if (completedDatasets.length === 0) {
    return (
      <div className="flex flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Advanced Analytics</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-96">
            <CardHeader className="text-center">
              <CardTitle>No Data Available</CardTitle>
              <CardDescription>Upload and process data files to perform advanced analytics.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild>
                <a href="/upload">Upload Data</a>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Advanced Analytics</h1>
          <Badge variant="outline">
            <Brain className="w-3 h-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Select value={selectedDatasetId} onValueChange={setSelectedDatasetId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select dataset" />
            </SelectTrigger>
            <SelectContent>
              {completedDatasets.map((dataset) => (
                <SelectItem key={dataset.id} value={dataset.id}>
                  {dataset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={analysisType} onValueChange={setAnalysisType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="correlation">Correlation</SelectItem>
              <SelectItem value="outliers">Outliers</SelectItem>
              <SelectItem value="trends">Trends</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Tabs value={analysisType} onValueChange={setAnalysisType} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="correlation">Correlation Analysis</TabsTrigger>
            <TabsTrigger value="outliers">Outlier Detection</TabsTrigger>
            <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="correlation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Correlation Analysis</CardTitle>
                <CardDescription>Discover relationships between numeric variables in your dataset</CardDescription>
              </CardHeader>
              <CardContent>
                {correlations.length > 0 ? (
                  <div className="space-y-4">
                    {correlations.map((corr, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {corr.x} vs {corr.y}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Correlation: {corr.correlation.toFixed(3)} ({corr.strength})
                              </p>
                            </div>
                            <Badge
                              variant={
                                corr.strength === "Strong"
                                  ? "default"
                                  : corr.strength === "Moderate"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {corr.strength}
                            </Badge>
                          </div>
                          <div className="mt-4 w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${Math.abs(corr.correlation) * 100}%` }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <Activity className="h-4 w-4" />
                    <AlertDescription>
                      No correlations found. Ensure your dataset has at least 2 numeric columns with sufficient data.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outliers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Outlier Detection</CardTitle>
                <CardDescription>Identify unusual values that may require attention</CardDescription>
              </CardHeader>
              <CardContent>
                {outliers.length > 0 ? (
                  <div className="space-y-4">
                    {outliers.map((outlier, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-medium">{outlier.column}</h4>
                              <p className="text-sm text-muted-foreground">
                                {outlier.count} outliers ({outlier.percentage}% of data)
                              </p>
                            </div>
                            <Badge variant="destructive">{outlier.count} outliers</Badge>
                          </div>
                          <div className="text-sm">
                            <p className="mb-2">
                              <strong>Normal range:</strong> {outlier.range}
                            </p>
                            <p>
                              <strong>Sample outliers:</strong> {outlier.outlierValues.join(", ")}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertDescription>
                      No significant outliers detected in your numeric columns. Your data appears to be
                      well-distributed.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trend Analysis</CardTitle>
                <CardDescription>Analyze temporal patterns and trends in your time-series data</CardDescription>
              </CardHeader>
              <CardContent>
                {trends.length > 0 ? (
                  <div className="space-y-4">
                    {trends.map((trend, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{trend.column}</h4>
                              <p className="text-sm text-muted-foreground">
                                {trend.direction} trend ({trend.strength})
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Slope: {trend.slope} | Data points: {trend.dataPoints}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  trend.direction === "Increasing"
                                    ? "default"
                                    : trend.direction === "Decreasing"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {trend.direction}
                              </Badge>
                              <TrendingUp
                                className={`h-4 w-4 ${
                                  trend.direction === "Increasing"
                                    ? "text-green-500"
                                    : trend.direction === "Decreasing"
                                      ? "text-red-500 rotate-180"
                                      : "text-gray-500"
                                }`}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      No trend analysis available. Ensure your dataset contains date/time columns and numeric data for
                      time-series analysis.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
