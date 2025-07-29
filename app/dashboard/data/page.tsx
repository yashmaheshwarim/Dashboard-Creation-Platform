"use client"

import { useState, useMemo } from "react"
import { Search, Filter, Download, Eye, Trash2, AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useDataStore } from "@/hooks/use-data-store"
import { InlineBadge } from "@/components/ui/inline-badge"

export default function DataPage() {
  const { datasets, deleteDataset } = useDataStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("")

  // Filter datasets based on search term
  const filteredDatasets = useMemo(() => {
    return datasets.filter(
      (dataset) =>
        dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dataset.originalName.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [datasets, searchTerm])

  // Get selected dataset for preview
  const selectedDataset = useMemo(() => {
    if (!selectedDatasetId) return datasets.find((d) => d.status === "completed")
    return datasets.find((d) => d.id === selectedDatasetId)
  }, [selectedDatasetId, datasets])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )
      case "processing":
        return <Badge variant="secondary">Processing</Badge>
      case "error":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "CSV":
        return "📊"
      case "XLSX":
      case "XLS":
        return "📈"
      case "JSON":
        return "📋"
      case "PDF":
        return "📄"
      default:
        return "📁"
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const exportDataset = (dataset: any) => {
    if (!dataset.visualizationData) return

    const dataStr = JSON.stringify(dataset.visualizationData.rawData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${dataset.name}_processed.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const completedDatasets = datasets.filter((d) => d.status === "completed")

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Data Management</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search datasets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-6 p-6">
        {/* Datasets Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Your Datasets</CardTitle>
            <CardDescription>Manage and explore your uploaded data files with ETL processing status</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDatasets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No datasets found</p>
                <Button asChild>
                  <a href="/upload">Upload Your First Dataset</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDatasets.map((dataset) => (
                  <div key={dataset.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{getTypeIcon(dataset.type)}</div>
                      <div>
                        <h3 className="font-medium">{dataset.originalName}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{formatFileSize(dataset.size)}</span>
                          {dataset.processedData && (
                            <>
                              <span>•</span>
                              <span>{dataset.processedData.cleanedRowCount.toLocaleString()} rows</span>
                              <span>•</span>
                              <span>{dataset.processedData.columns.length} columns</span>
                              <span>•</span>
                              <span>Quality: {dataset.processedData.qualityReport.qualityScore}%</span>
                            </>
                          )}
                          <span>•</span>
                          <span>Uploaded {new Date(dataset.uploadDate).toLocaleDateString()}</span>
                        </div>
                        {dataset.error && (
                          <Alert className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{dataset.error}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(dataset.status)}
                      {dataset.status === "completed" && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedDatasetId(dataset.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => exportDataset(dataset)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => deleteDataset(dataset.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Preview */}
        {selectedDataset?.visualizationData && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Data Preview</CardTitle>
                  <CardDescription>Preview the processed data from your selected dataset</CardDescription>
                </div>
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
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {selectedDataset.processedData?.columns.slice(0, 6).map((column) => (
                        <TableHead key={column.name}>
                          {column.name}
                          <InlineBadge variant="outline" className="ml-2 text-xs">
                            {column.type}
                          </InlineBadge>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDataset.visualizationData.rawData.slice(0, 10).map((row: any, index: number) => (
                      <TableRow key={index}>
                        {selectedDataset.processedData?.columns.slice(0, 6).map((column) => (
                          <TableCell key={column.name}>
                            {row[column.name] !== null && row[column.name] !== undefined ? (
                              String(row[column.name]).slice(0, 50)
                            ) : (
                              <span className="text-muted-foreground">null</span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing 10 of {selectedDataset.visualizationData.rawData.length.toLocaleString()} rows
                  {selectedDataset.processedData &&
                    selectedDataset.processedData.columns.length > 6 &&
                    ` • ${selectedDataset.processedData.columns.length - 6} more columns`}
                </p>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    Previous
                  </Button>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Column Statistics */}
        {selectedDataset?.visualizationData && (
          <Card>
            <CardHeader>
              <CardTitle>Column Statistics</CardTitle>
              <CardDescription>Statistical summary of your data columns after ETL processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {selectedDataset.visualizationData.summaryStats.map((stat: any) => (
                  <Card key={stat.column}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{stat.column}</CardTitle>
                      <Badge variant="outline" className="w-fit">
                        {stat.type}
                      </Badge>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      {stat.type === "number" && (
                        <>
                          <div className="flex justify-between">
                            <span>Min:</span>
                            <span>{stat.min?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Max:</span>
                            <span>{stat.max?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Avg:</span>
                            <span>{stat.avg?.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between">
                        <span>Unique:</span>
                        <span>{stat.uniqueCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nulls:</span>
                        <span>{stat.nullCount}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
