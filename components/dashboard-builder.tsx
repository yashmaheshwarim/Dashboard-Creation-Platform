"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InlineBadge } from "@/components/ui/inline-badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  LineChartIcon,
  PieChartIcon,
  ScatterChartIcon,
  TableIcon,
  TrendingUp,
  X,
  Settings,
  Eye,
  Download,
} from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

interface ChartConfig {
  id: string
  type: "bar" | "line" | "pie" | "scatter" | "area" | "table" | "kpi"
  title: string
  xAxis?: string
  yAxis?: string
  groupBy?: string
  aggregation?: "sum" | "avg" | "count" | "min" | "max"
  filters?: Array<{ column: string; operator: string; value: any }>
  position: { x: number; y: number; w: number; h: number }
}

interface DashboardBuilderProps {
  data: Record<string, any>[]
  columns: any[]
  onSave?: (config: ChartConfig[]) => void
}

const CHART_TYPES = [
  { id: "bar", name: "Bar Chart", icon: BarChart3, description: "Compare categories" },
  { id: "line", name: "Line Chart", icon: LineChartIcon, description: "Show trends over time" },
  { id: "area", name: "Area Chart", icon: TrendingUp, description: "Show cumulative trends" },
  { id: "pie", name: "Pie Chart", icon: PieChartIcon, description: "Show proportions" },
  { id: "scatter", name: "Scatter Plot", icon: ScatterChartIcon, description: "Show correlations" },
  { id: "table", name: "Data Table", icon: TableIcon, description: "Display raw data" },
  { id: "kpi", name: "KPI Card", icon: TrendingUp, description: "Show key metrics" },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

export default function DashboardBuilder({ data, columns, onSave }: DashboardBuilderProps) {
  const [charts, setCharts] = useState<ChartConfig[]>([])
  const [selectedChart, setSelectedChart] = useState<string | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // Get numeric and categorical columns
  const numericColumns = useMemo(() => columns.filter((col) => col.type === "number"), [columns])
  const categoricalColumns = useMemo(() => columns.filter((col) => col.type === "string"), [columns])
  const dateColumns = useMemo(() => columns.filter((col) => col.type === "date"), [columns])

  // Add new chart
  const addChart = (type: ChartConfig["type"]) => {
    const newChart: ChartConfig = {
      id: `chart-${Date.now()}`,
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
      position: { x: 0, y: 0, w: 6, h: 4 },
      aggregation: "sum",
    }

    // Set default axes based on chart type
    if (type === "bar" || type === "line" || type === "area") {
      newChart.xAxis = categoricalColumns[0]?.name || columns[0]?.name
      newChart.yAxis = numericColumns[0]?.name || columns[1]?.name
    } else if (type === "scatter") {
      newChart.xAxis = numericColumns[0]?.name || columns[0]?.name
      newChart.yAxis = numericColumns[1]?.name || columns[1]?.name
    } else if (type === "pie") {
      newChart.groupBy = categoricalColumns[0]?.name || columns[0]?.name
      newChart.yAxis = numericColumns[0]?.name || columns[1]?.name
    }

    setCharts((prev) => [...prev, newChart])
    setSelectedChart(newChart.id)
  }

  // Update chart configuration
  const updateChart = (id: string, updates: Partial<ChartConfig>) => {
    setCharts((prev) => prev.map((chart) => (chart.id === id ? { ...chart, ...updates } : chart)))
  }

  // Delete chart
  const deleteChart = (id: string) => {
    setCharts((prev) => prev.filter((chart) => chart.id !== id))
    if (selectedChart === id) {
      setSelectedChart(null)
    }
  }

  // Process data for chart
  const processChartData = (chart: ChartConfig) => {
    let processedData = [...data]

    // Apply filters
    if (chart.filters) {
      chart.filters.forEach((filter) => {
        processedData = processedData.filter((row) => {
          const value = row[filter.column]
          switch (filter.operator) {
            case "equals":
              return value === filter.value
            case "contains":
              return String(value).includes(filter.value)
            case "greater":
              return Number(value) > Number(filter.value)
            case "less":
              return Number(value) < Number(filter.value)
            default:
              return true
          }
        })
      })
    }

    // Aggregate data based on chart type
    if (chart.type === "pie") {
      const grouped = processedData.reduce(
        (acc, row) => {
          const key = row[chart.groupBy!]
          if (!acc[key]) acc[key] = 0

          if (chart.aggregation === "count") {
            acc[key] += 1
          } else if (chart.yAxis) {
            const value = Number(row[chart.yAxis]) || 0
            switch (chart.aggregation) {
              case "sum":
                acc[key] += value
                break
              case "avg":
                acc[key] = (acc[key] + value) / 2
                break
              case "max":
                acc[key] = Math.max(acc[key], value)
                break
              case "min":
                acc[key] = Math.min(acc[key], value)
                break
              default:
                acc[key] += value
            }
          }
          return acc
        },
        {} as Record<string, number>,
      )

      return Object.entries(grouped).map(([name, value]) => ({ name, value }))
    }

    if (chart.type === "bar" || chart.type === "line" || chart.type === "area") {
      if (!chart.xAxis || !chart.yAxis) return []

      const grouped = processedData.reduce(
        (acc, row) => {
          const key = row[chart.xAxis!]
          if (!acc[key]) acc[key] = { x: key, values: [] }
          acc[key].values.push(Number(row[chart.yAxis!]) || 0)
          return acc
        },
        {} as Record<string, { x: any; values: number[] }>,
      )

      return Object.values(grouped).map((group) => {
        let y = 0
        switch (chart.aggregation) {
          case "sum":
            y = group.values.reduce((sum, val) => sum + val, 0)
            break
          case "avg":
            y = group.values.reduce((sum, val) => sum + val, 0) / group.values.length
            break
          case "count":
            y = group.values.length
            break
          case "max":
            y = Math.max(...group.values)
            break
          case "min":
            y = Math.min(...group.values)
            break
          default:
            y = group.values.reduce((sum, val) => sum + val, 0)
        }
        return { x: group.x, y }
      })
    }

    if (chart.type === "scatter") {
      return processedData.map((row) => ({
        x: Number(row[chart.xAxis!]) || 0,
        y: Number(row[chart.yAxis!]) || 0,
      }))
    }

    if (chart.type === "kpi") {
      if (!chart.yAxis) return { value: 0, label: "No Data" }

      const values = processedData.map((row) => Number(row[chart.yAxis!]) || 0)
      let value = 0

      switch (chart.aggregation) {
        case "sum":
          value = values.reduce((sum, val) => sum + val, 0)
          break
        case "avg":
          value = values.reduce((sum, val) => sum + val, 0) / values.length
          break
        case "count":
          value = values.length
          break
        case "max":
          value = Math.max(...values)
          break
        case "min":
          value = Math.min(...values)
          break
        default:
          value = values.reduce((sum, val) => sum + val, 0)
      }

      return { value, label: chart.title }
    }

    return processedData.slice(0, 100) // For table view
  }

  // Render chart component
  const renderChart = (chart: ChartConfig) => {
    const chartData = processChartData(chart)

    const chartConfig = {
      primary: { label: "Value", color: "#2563eb" },
      secondary: { label: "Secondary", color: "#60a5fa" },
    }

    switch (chart.type) {
      case "bar":
        return (
          <ChartContainer config={chartConfig} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData as any[]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="y" fill={chartConfig.primary.color} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )

      case "line":
        return (
          <ChartContainer config={chartConfig} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData as any[]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="y" stroke={chartConfig.primary.color} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )

      case "area":
        return (
          <ChartContainer config={chartConfig} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData as any[]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="y"
                  stroke={chartConfig.primary.color}
                  fill={chartConfig.primary.color}
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )

      case "pie":
        return (
          <ChartContainer config={chartConfig} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData as any[]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(chartData as any[]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        )

      case "scatter":
        return (
          <ChartContainer config={chartConfig} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={chartData as any[]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis dataKey="y" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Scatter dataKey="y" fill={chartConfig.primary.color} />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        )

      case "kpi":
        const kpiData = chartData as { value: number; label: string }
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl font-bold text-primary mb-2">{kpiData.value.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">{kpiData.label}</div>
          </div>
        )

      case "table":
        return (
          <div className="h-full overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {columns.slice(0, 5).map((col) => (
                    <th key={col.name} className="p-2 text-left">
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(chartData as any[]).map((row, index) => (
                  <tr key={index} className="border-b">
                    {columns.slice(0, 5).map((col) => (
                      <td key={col.name} className="p-2">
                        {row[col.name]?.toString().slice(0, 50) || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      default:
        return <div className="flex items-center justify-center h-full text-muted-foreground">Select chart type</div>
    }
  }

  const selectedChartConfig = charts.find((c) => c.id === selectedChart)

  if (isPreviewMode) {
    return (
      <div className="h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Dashboard Preview</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPreviewMode(false)}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Mode
            </Button>
            <Button onClick={() => onSave?.(charts)}>
              <Download className="h-4 w-4 mr-2" />
              Save Dashboard
            </Button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-12 gap-4 h-[calc(100%-80px)]">
          {charts.map((chart) => (
            <Card
              key={chart.id}
              className="col-span-6"
              style={{
                minHeight: `${chart.position.h * 100}px`,
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{chart.title}</CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-60px)]">{renderChart(chart)}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex">
      {/* Chart Library */}
      <div className="w-80 border-r bg-muted/30">
        <div className="p-4 border-b">
          <h3 className="font-semibold mb-4">Chart Library</h3>
          <div className="grid grid-cols-2 gap-2">
            {CHART_TYPES.map((chartType) => (
              <Button
                key={chartType.id}
                variant="outline"
                className="h-auto p-3 flex flex-col items-center gap-2 bg-transparent"
                onClick={() => addChart(chartType.id as ChartConfig["type"])}
              >
                <chartType.icon className="h-6 w-6" />
                <div className="text-center">
                  <div className="text-xs font-medium">{chartType.name}</div>
                  <div className="text-xs text-muted-foreground">{chartType.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Chart List */}
        <div className="p-4">
          <h4 className="font-medium mb-3">Dashboard Charts</h4>
          <div className="space-y-2">
            {charts.map((chart) => {
              const ChartIcon = CHART_TYPES.find((t) => t.id === chart.type)?.icon
              return (
                <div
                  key={chart.id}
                  className={`p-3 rounded border cursor-pointer transition-colors ${
                    selectedChart === chart.id ? "bg-primary/10 border-primary" : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedChart(chart.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {ChartIcon && <ChartIcon className="h-4 w-4" />}
                      <span className="text-sm font-medium">{chart.title}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteChart(chart.id)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="mt-1">
                    <InlineBadge variant="outline" className="text-xs">
                      {chart.type}
                    </InlineBadge>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Dashboard Builder</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPreviewMode(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={() => onSave?.(charts)} disabled={charts.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Save Dashboard
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Canvas */}
          <div className="flex-1 p-4">
            {charts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <div className="text-muted-foreground mb-4">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Start building your dashboard</p>
                    <p className="text-sm">Select a chart type from the library to get started</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-4 h-full">
                {charts.map((chart) => (
                  <Card
                    key={chart.id}
                    className={`col-span-6 ${selectedChart === chart.id ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setSelectedChart(chart.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{chart.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">{renderChart(chart)}</CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Properties Panel */}
          {selectedChartConfig && (
            <div className="w-80 border-l bg-muted/30 p-4">
              <h3 className="font-semibold mb-4">Chart Properties</h3>

              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="data">Data</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                  <div>
                    <Label htmlFor="title">Chart Title</Label>
                    <Input
                      id="title"
                      value={selectedChartConfig.title}
                      onChange={(e) => updateChart(selectedChartConfig.id, { title: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="chart-type">Chart Type</Label>
                    <Select
                      value={selectedChartConfig.type}
                      onValueChange={(value) =>
                        updateChart(selectedChartConfig.id, { type: value as ChartConfig["type"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHART_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="data" className="space-y-4">
                  {(selectedChartConfig.type === "bar" ||
                    selectedChartConfig.type === "line" ||
                    selectedChartConfig.type === "area") && (
                    <>
                      <div>
                        <Label htmlFor="x-axis">X-Axis</Label>
                        <Select
                          value={selectedChartConfig.xAxis || ""}
                          onValueChange={(value) => updateChart(selectedChartConfig.id, { xAxis: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {columns.map((col) => (
                              <SelectItem key={col.name} value={col.name}>
                                {col.name} ({col.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="y-axis">Y-Axis</Label>
                        <Select
                          value={selectedChartConfig.yAxis || ""}
                          onValueChange={(value) => updateChart(selectedChartConfig.id, { yAxis: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {numericColumns.map((col) => (
                              <SelectItem key={col.name} value={col.name}>
                                {col.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {selectedChartConfig.type === "pie" && (
                    <>
                      <div>
                        <Label htmlFor="group-by">Group By</Label>
                        <Select
                          value={selectedChartConfig.groupBy || ""}
                          onValueChange={(value) => updateChart(selectedChartConfig.id, { groupBy: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {categoricalColumns.map((col) => (
                              <SelectItem key={col.name} value={col.name}>
                                {col.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="value">Value</Label>
                        <Select
                          value={selectedChartConfig.yAxis || ""}
                          onValueChange={(value) => updateChart(selectedChartConfig.id, { yAxis: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {numericColumns.map((col) => (
                              <SelectItem key={col.name} value={col.name}>
                                {col.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {selectedChartConfig.type === "scatter" && (
                    <>
                      <div>
                        <Label htmlFor="x-axis">X-Axis</Label>
                        <Select
                          value={selectedChartConfig.xAxis || ""}
                          onValueChange={(value) => updateChart(selectedChartConfig.id, { xAxis: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {numericColumns.map((col) => (
                              <SelectItem key={col.name} value={col.name}>
                                {col.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="y-axis">Y-Axis</Label>
                        <Select
                          value={selectedChartConfig.yAxis || ""}
                          onValueChange={(value) => updateChart(selectedChartConfig.id, { yAxis: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {numericColumns.map((col) => (
                              <SelectItem key={col.name} value={col.name}>
                                {col.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {selectedChartConfig.type === "kpi" && (
                    <div>
                      <Label htmlFor="metric">Metric</Label>
                      <Select
                        value={selectedChartConfig.yAxis || ""}
                        onValueChange={(value) => updateChart(selectedChartConfig.id, { yAxis: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {numericColumns.map((col) => (
                            <SelectItem key={col.name} value={col.name}>
                              {col.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="aggregation">Aggregation</Label>
                    <Select
                      value={selectedChartConfig.aggregation || "sum"}
                      onValueChange={(value) =>
                        updateChart(selectedChartConfig.id, { aggregation: value as ChartConfig["aggregation"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sum">Sum</SelectItem>
                        <SelectItem value="avg">Average</SelectItem>
                        <SelectItem value="count">Count</SelectItem>
                        <SelectItem value="min">Minimum</SelectItem>
                        <SelectItem value="max">Maximum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Named export for compatibility
export { DashboardBuilder }
