"use client"

import { useState, useMemo } from "react"
import { Download, Filter, RefreshCw, TrendingUp, Users, DollarSign, Activity, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useDataStore } from "@/hooks/use-data-store"
import { ImputationDialog } from "@/components/imputation-dialog"
import DashboardBuilder from "@/components/dashboard-builder"
import { DataImputation, type ImputationStrategy } from "@/lib/data-imputation"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
} from "recharts"

const chartConfig = {
  primary: {
    label: "Primary",
    color: "#2563eb",
  },
  secondary: {
    label: "Secondary",
    color: "#60a5fa",
  },
  tertiary: {
    label: "Tertiary",
    color: "#f87171",
  },
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

export default function DashboardPage() {
  const { completedDatasets, updateDataset } = useDataStore()
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("")
  const [dateRange, setDateRange] = useState<any>(null)
  const [isImputationProcessing, setIsImputationProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Get selected dataset
  const selectedDataset = useMemo(() => {
    if (!selectedDatasetId) return completedDatasets[0]
    return completedDatasets.find((d) => d.id === selectedDatasetId) || completedDatasets[0]
  }, [selectedDatasetId, completedDatasets])

  // Handle data imputation
  const handleImputation = async (strategies: ImputationStrategy[]) => {
    if (!selectedDataset?.processedData) return

    setIsImputationProcessing(true)

    try {
      const { imputedData, results } = DataImputation.imputeMissingData(
        selectedDataset.visualizationData.rawData,
        selectedDataset.processedData.columns,
        strategies,
      )

      // Update the dataset with imputed data
      const updatedProcessedData = {
        ...selectedDataset.processedData,
        data: imputedData,
        cleanedRowCount: imputedData.length,
      }

      // Recalculate quality report
      const totalCells = imputedData.length * selectedDataset.processedData.columns.length
      const nullValues = selectedDataset.processedData.columns.reduce((sum, col) => {
        const nullCount = imputedData.filter(
          (row) => row[col.name] === null || row[col.name] === undefined || row[col.name] === "",
        ).length
        return sum + nullCount
      }, 0)

      const qualityScore = Math.max(0, Math.min(100, 100 - (nullValues / totalCells) * 100))

      updatedProcessedData.qualityReport = {
        ...selectedDataset.processedData.qualityReport,
        nullValues,
        qualityScore: Math.round(qualityScore),
        issues: nullValues > 0 ? [`${nullValues} null values remaining`] : [],
        suggestions: nullValues > 0 ? ["Consider additional imputation methods"] : ["Data quality is excellent"],
      }

      // Update visualization data
      const updatedVisualizationData = {
        ...selectedDataset.visualizationData,
        rawData: imputedData,
      }

      updateDataset(selectedDataset.id, {
        processedData: updatedProcessedData,
        visualizationData: updatedVisualizationData,
      })
    } catch (error) {
      console.error("Imputation failed:", error)
    } finally {
      setIsImputationProcessing(false)
    }
  }

  // Generate KPIs from data
  const kpis = useMemo(() => {
    if (!selectedDataset?.visualizationData) {
      return {
        totalRecords: 0,
        dataQuality: 0,
        numericColumns: 0,
        categoricalColumns: 0,
      }
    }

    const { rawData, summaryStats } = selectedDataset.visualizationData
    const qualityScore = selectedDataset.processedData?.qualityReport.qualityScore || 0

    return {
      totalRecords: rawData.length,
      dataQuality: qualityScore,
      numericColumns: summaryStats.filter((s: any) => s.type === "number").length,
      categoricalColumns: summaryStats.filter((s: any) => s.type === "string").length,
    }
  }, [selectedDataset])

  // Get chart data
  const chartData = useMemo(() => {
    if (!selectedDataset?.visualizationData) return null
    return selectedDataset.visualizationData.chartData
  }, [selectedDataset])

  const exportData = () => {
    if (!selectedDataset?.visualizationData) return

    const dataStr = JSON.stringify(selectedDataset.visualizationData.rawData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${selectedDataset.name}_processed.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (completedDatasets.length === 0) {
    return (
      <div className="flex flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Analytics Dashboard</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-96">
            <CardHeader className="text-center">
              <CardTitle>No Data Available</CardTitle>
              <CardDescription>Upload and process some data files to start creating dashboards.</CardDescription>
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
          <h1 className="text-lg font-semibold">Analytics Dashboard</h1>
          {selectedDataset && (
            <Badge variant="outline">{selectedDataset.processedData?.qualityReport.qualityScore}% Quality</Badge>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <DatePickerWithRange />
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
          {selectedDataset?.processedData && (
            <ImputationDialog
              columns={selectedDataset.processedData.columns}
              onImpute={handleImputation}
              isProcessing={isImputationProcessing}
            />
          )}
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="builder">Dashboard Builder</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 space-y-6 p-6 overflow-y-auto">
            {/* Data Quality Alert */}
            {selectedDataset?.processedData?.qualityReport.qualityScore &&
              selectedDataset.processedData.qualityReport.qualityScore < 80 && (
                <Alert>
                  <Wand2 className="h-4 w-4" />
                  <AlertDescription>
                    Data quality can be improved. Use the "Fix Missing Data" feature to enhance your dataset quality.
                  </AlertDescription>
                </Alert>
              )}

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.totalRecords.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">After ETL processing</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.dataQuality}%</div>
                  <p className="text-xs text-muted-foreground">Quality score after cleaning</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Numeric Columns</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.numericColumns}</div>
                  <p className="text-xs text-muted-foreground">Available for analysis</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Categories</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.categoricalColumns}</div>
                  <p className="text-xs text-muted-foreground">Categorical dimensions</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Time Series Chart */}
              {chartData?.timeSeries && (
                <Card>
                  <CardHeader>
                    <CardTitle>Time Series Analysis</CardTitle>
                    <CardDescription>Trends over time from your data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData.timeSeries}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="value" stroke={chartConfig.primary.color} strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              {/* Category Distribution */}
              {chartData?.categoryDistribution && (
                <Card>
                  <CardHeader>
                    <CardTitle>Category Distribution</CardTitle>
                    <CardDescription>Distribution of categorical data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData.categoryDistribution}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {chartData.categoryDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              {/* Correlation Scatter Plot */}
              {chartData?.correlation && (
                <Card>
                  <CardHeader>
                    <CardTitle>Correlation Analysis</CardTitle>
                    <CardDescription>Relationship between numeric variables</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart data={chartData.correlation}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="x" />
                          <YAxis dataKey="y" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Scatter dataKey="y" fill={chartConfig.primary.color} />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              {/* Data Quality Report */}
              {selectedDataset?.processedData?.qualityReport && (
                <Card>
                  <CardHeader>
                    <CardTitle>Data Quality Report</CardTitle>
                    <CardDescription>ETL processing results and recommendations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Original Rows:</p>
                          <p>{selectedDataset.processedData.originalRowCount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="font-medium">Cleaned Rows:</p>
                          <p>{selectedDataset.processedData.cleanedRowCount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="font-medium">Duplicates Removed:</p>
                          <p>{selectedDataset.processedData.qualityReport.duplicateRows}</p>
                        </div>
                        <div>
                          <p className="font-medium">Null Values:</p>
                          <p>{selectedDataset.processedData.qualityReport.nullValues}</p>
                        </div>
                      </div>

                      {selectedDataset.processedData.qualityReport.issues.length > 0 && (
                        <div>
                          <p className="font-medium text-sm mb-2">Issues Found:</p>
                          <ul className="text-sm space-y-1">
                            {selectedDataset.processedData.qualityReport.issues.map((issue, index) => (
                              <li key={index} className="text-amber-600">
                                • {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedDataset.processedData.qualityReport.suggestions.length > 0 && (
                        <div>
                          <p className="font-medium text-sm mb-2">Suggestions:</p>
                          <ul className="text-sm space-y-1">
                            {selectedDataset.processedData.qualityReport.suggestions.map((suggestion, index) => (
                              <li key={index} className="text-blue-600">
                                • {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="builder" className="flex-1 overflow-hidden">
            {selectedDataset?.visualizationData ? (
              <DashboardBuilder
                data={selectedDataset.visualizationData.rawData}
                columns={selectedDataset.processedData?.columns || []}
                onSave={(config) => {
                  console.log("Dashboard saved:", config)
                  // Here you could save the dashboard configuration
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Card className="w-96">
                  <CardHeader className="text-center">
                    <CardTitle>No Data Available</CardTitle>
                    <CardDescription>Please select a dataset to start building dashboards.</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="insights" className="flex-1 space-y-6 p-6 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      AI insights feature coming soon! This will provide automated pattern detection, anomaly
                      identification, and predictive analytics.
                    </AlertDescription>
                  </Alert>

                  {selectedDataset?.processedData && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Data Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                          <p>
                            • Dataset contains {selectedDataset.processedData.cleanedRowCount.toLocaleString()} records
                          </p>
                          <p>• {selectedDataset.processedData.columns.length} columns analyzed</p>
                          <p>• Data quality score: {selectedDataset.processedData.qualityReport.qualityScore}%</p>
                          <p>
                            • {selectedDataset.processedData.columns.filter((c) => c.type === "number").length} numeric
                            variables for analysis
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                          {selectedDataset.processedData.qualityReport.qualityScore < 80 && (
                            <p>• Consider improving data quality through imputation</p>
                          )}
                          {selectedDataset.processedData.columns.filter((c) => c.type === "date").length > 0 && (
                            <p>• Time series analysis available with date columns</p>
                          )}
                          {selectedDataset.processedData.columns.filter((c) => c.type === "number").length >= 2 && (
                            <p>• Correlation analysis possible between numeric variables</p>
                          )}
                          <p>• Use Dashboard Builder to create custom visualizations</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
