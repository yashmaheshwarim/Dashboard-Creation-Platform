"use client"

import { useState, useMemo } from "react"
import { FileText, Download, TrendingUp, BarChart3, PieChart, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { useDataStore } from "@/hooks/use-data-store"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer } from "recharts"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

export default function ReportsPage() {
  const { completedDatasets } = useDataStore()
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("")
  const [reportType, setReportType] = useState<string>("summary")

  const selectedDataset = useMemo(() => {
    if (!selectedDatasetId) return completedDatasets[0]
    return completedDatasets.find((d) => d.id === selectedDatasetId) || completedDatasets[0]
  }, [selectedDatasetId, completedDatasets])

  const generateSummaryReport = () => {
    if (!selectedDataset?.processedData) return null

    const { processedData, visualizationData } = selectedDataset
    const { qualityReport, columns, cleanedRowCount, originalRowCount } = processedData

    return {
      overview: {
        totalRecords: cleanedRowCount,
        originalRecords: originalRowCount,
        recordsRemoved: originalRowCount - cleanedRowCount,
        totalColumns: columns.length,
        dataQuality: qualityReport.qualityScore,
        nullValues: qualityReport.nullValues,
        duplicatesRemoved: qualityReport.duplicateRows,
      },
      columnBreakdown: {
        numeric: columns.filter((col) => col.type === "number").length,
        categorical: columns.filter((col) => col.type === "string").length,
        dates: columns.filter((col) => col.type === "date").length,
        boolean: columns.filter((col) => col.type === "boolean").length,
      },
      dataQualityIssues: qualityReport.issues,
      recommendations: qualityReport.suggestions,
    }
  }

  const generateDataProfileReport = () => {
    if (!selectedDataset?.visualizationData) return null

    const { summaryStats } = selectedDataset.visualizationData

    return summaryStats.map((stat: any) => ({
      column: stat.column,
      type: stat.type,
      uniqueCount: stat.uniqueCount,
      nullCount: stat.nullCount,
      completeness: ((stat.uniqueCount / (stat.uniqueCount + stat.nullCount)) * 100).toFixed(1),
      ...(stat.type === "number" && {
        min: stat.min,
        max: stat.max,
        mean: stat.avg,
        range: stat.max - stat.min,
      }),
    }))
  }

  const exportReport = (format: "pdf" | "csv" | "json") => {
    if (!selectedDataset) return

    const reportData = {
      dataset: selectedDataset.name,
      generatedAt: new Date().toISOString(),
      summary: generateSummaryReport(),
      dataProfile: generateDataProfileReport(),
    }

    let content: string
    let filename: string
    let mimeType: string

    switch (format) {
      case "json":
        content = JSON.stringify(reportData, null, 2)
        filename = `${selectedDataset.name}_report.json`
        mimeType = "application/json"
        break
      case "csv":
        const csvData = generateDataProfileReport()
        if (!csvData) return
        const headers = Object.keys(csvData[0]).join(",")
        const rows = csvData.map((row) => Object.values(row).join(",")).join("\n")
        content = `${headers}\n${rows}`
        filename = `${selectedDataset.name}_profile.csv`
        mimeType = "text/csv"
        break
      default:
        content = JSON.stringify(reportData, null, 2)
        filename = `${selectedDataset.name}_report.json`
        mimeType = "application/json"
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const summaryReport = generateSummaryReport()
  const dataProfile = generateDataProfileReport()

  if (completedDatasets.length === 0) {
    return (
      <div className="flex flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Reports</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-96">
            <CardHeader className="text-center">
              <CardTitle>No Data Available</CardTitle>
              <CardDescription>Upload and process data files to generate reports.</CardDescription>
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
          <h1 className="text-lg font-semibold">Reports</h1>
          <Badge variant="outline">
            <FileText className="w-3 h-3 mr-1" />
            Analytics
          </Badge>
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
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Summary</SelectItem>
              <SelectItem value="profile">Data Profile</SelectItem>
              <SelectItem value="quality">Quality Report</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => exportReport("json")}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary Report</TabsTrigger>
            <TabsTrigger value="profile">Data Profile</TabsTrigger>
            <TabsTrigger value="quality">Quality Assessment</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            {summaryReport && (
              <>
                {/* Overview Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{summaryReport.overview.totalRecords.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        {summaryReport.overview.recordsRemoved > 0 &&
                          `${summaryReport.overview.recordsRemoved} removed during cleaning`}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{summaryReport.overview.dataQuality}%</div>
                      <p className="text-xs text-muted-foreground">
                        {summaryReport.overview.dataQuality >= 80
                          ? "Excellent"
                          : summaryReport.overview.dataQuality >= 60
                            ? "Good"
                            : "Needs Improvement"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Columns</CardTitle>
                      <PieChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{summaryReport.overview.totalColumns}</div>
                      <p className="text-xs text-muted-foreground">
                        {summaryReport.columnBreakdown.numeric} numeric, {summaryReport.columnBreakdown.categorical}{" "}
                        categorical
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Data Issues</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{summaryReport.overview.nullValues}</div>
                      <p className="text-xs text-muted-foreground">Null values found</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Column Type Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Column Type Distribution</CardTitle>
                    <CardDescription>Breakdown of data types in your dataset</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={[
                              { name: "Numeric", value: summaryReport.columnBreakdown.numeric },
                              { name: "Categorical", value: summaryReport.columnBreakdown.categorical },
                              { name: "Date", value: summaryReport.columnBreakdown.dates },
                              { name: "Boolean", value: summaryReport.columnBreakdown.boolean },
                            ].filter((item) => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {[
                              { name: "Numeric", value: summaryReport.columnBreakdown.numeric },
                              { name: "Categorical", value: summaryReport.columnBreakdown.categorical },
                              { name: "Date", value: summaryReport.columnBreakdown.dates },
                              { name: "Boolean", value: summaryReport.columnBreakdown.boolean },
                            ]
                              .filter((item) => item.value > 0)
                              .map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                          </Pie>
                          <ChartTooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Issues and Recommendations */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Quality Issues</CardTitle>
                      <CardDescription>Issues identified during ETL processing</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {summaryReport.dataQualityIssues.length > 0 ? (
                        <ul className="space-y-2">
                          {summaryReport.dataQualityIssues.map((issue, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-amber-500">⚠️</span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No significant issues found.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recommendations</CardTitle>
                      <CardDescription>Suggested improvements for your data</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {summaryReport.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-blue-500">💡</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            {dataProfile && (
              <Card>
                <CardHeader>
                  <CardTitle>Data Profile Report</CardTitle>
                  <CardDescription>Detailed statistics for each column in your dataset</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dataProfile.map((profile: any) => (
                      <Card key={profile.column}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{profile.column}</CardTitle>
                            <Badge variant="outline">{profile.type}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="font-medium">Unique Values</p>
                              <p className="text-muted-foreground">{profile.uniqueCount}</p>
                            </div>
                            <div>
                              <p className="font-medium">Missing Values</p>
                              <p className="text-muted-foreground">{profile.nullCount}</p>
                            </div>
                            <div>
                              <p className="font-medium">Completeness</p>
                              <p className="text-muted-foreground">{profile.completeness}%</p>
                            </div>
                            {profile.type === "number" && (
                              <>
                                <div>
                                  <p className="font-medium">Range</p>
                                  <p className="text-muted-foreground">
                                    {profile.min?.toFixed(2)} - {profile.max?.toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="font-medium">Mean</p>
                                  <p className="text-muted-foreground">{profile.mean?.toFixed(2)}</p>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="quality" className="space-y-6">
            {selectedDataset?.processedData && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Data Quality Assessment</CardTitle>
                    <CardDescription>Comprehensive quality analysis of your dataset</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Quality Score */}
                      <div className="text-center">
                        <div className="text-6xl font-bold text-primary mb-2">
                          {selectedDataset.processedData.qualityReport.qualityScore}%
                        </div>
                        <p className="text-lg text-muted-foreground">Overall Data Quality Score</p>
                      </div>

                      {/* Quality Metrics */}
                      <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Completeness</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {(
                                ((selectedDataset.processedData.cleanedRowCount *
                                  selectedDataset.processedData.columns.length -
                                  selectedDataset.processedData.qualityReport.nullValues) /
                                  (selectedDataset.processedData.cleanedRowCount *
                                    selectedDataset.processedData.columns.length)) *
                                100
                              ).toFixed(1)}
                              %
                            </div>
                            <p className="text-xs text-muted-foreground">Non-null values</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Uniqueness</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {(
                                ((selectedDataset.processedData.originalRowCount -
                                  selectedDataset.processedData.qualityReport.duplicateRows) /
                                  selectedDataset.processedData.originalRowCount) *
                                100
                              ).toFixed(1)}
                              %
                            </div>
                            <p className="text-xs text-muted-foreground">Unique records</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Consistency</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {selectedDataset.processedData.qualityReport.issues.length === 0 ? "100" : "85"}%
                            </div>
                            <p className="text-xs text-muted-foreground">Data consistency</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* ETL Processing Summary */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">ETL Processing Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="font-medium">Original Records</p>
                              <p className="text-muted-foreground">
                                {selectedDataset.processedData.originalRowCount.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium">Cleaned Records</p>
                              <p className="text-muted-foreground">
                                {selectedDataset.processedData.cleanedRowCount.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium">Duplicates Removed</p>
                              <p className="text-muted-foreground">
                                {selectedDataset.processedData.qualityReport.duplicateRows}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium">Null Values</p>
                              <p className="text-muted-foreground">
                                {selectedDataset.processedData.qualityReport.nullValues}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
