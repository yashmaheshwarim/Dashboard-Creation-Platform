"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileSpreadsheet, FileText, X, CheckCircle, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ETLProcessor } from "@/lib/etl-processor"
import { useDataStore } from "@/hooks/use-data-store"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: "uploading" | "processing" | "completed" | "error"
  progress: number
  qualityScore?: number
  issues?: string[]
  error?: string
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const { addDataset, updateDataset } = useDataStore()
  const router = useRouter()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const processFile = async (file: File) => {
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "uploading",
      progress: 0,
    }

    setFiles((prev) => [...prev, newFile])

    // Add to data store
    addDataset({
      id: fileId,
      name: file.name.split(".")[0],
      originalName: file.name,
      type: file.name.split(".").pop()?.toUpperCase() || "UNKNOWN",
      size: file.size,
      uploadDate: new Date().toISOString(),
      status: "uploading",
    })

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 50; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress } : f)))
      }

      // Start processing
      setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "processing", progress: 60 } : f)))

      updateDataset(fileId, { status: "processing" })

      // Extract data
      const { data, headers } = await ETLProcessor.extractData(file)

      setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress: 80 } : f)))

      // Transform and clean data
      const processedData = ETLProcessor.transformData(data, headers)

      // Generate visualization data
      const visualizationData = ETLProcessor.loadForVisualization(processedData)

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "completed",
                progress: 100,
                qualityScore: processedData.qualityReport.qualityScore,
                issues: processedData.qualityReport.issues,
              }
            : f,
        ),
      )

      // Update data store
      updateDataset(fileId, {
        status: "completed",
        processedData,
        visualizationData,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "error",
                error: errorMessage,
              }
            : f,
        ),
      )

      updateDataset(fileId, {
        status: "error",
        error: errorMessage,
      })
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    droppedFiles.forEach(processFile)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    selectedFiles.forEach(processFile)
  }

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const getFileIcon = (type: string) => {
    if (type.includes("sheet") || type.includes("excel")) {
      return <FileSpreadsheet className="h-6 w-6 text-green-600" />
    }
    if (type.includes("pdf")) {
      return <FileText className="h-6 w-6 text-red-600" />
    }
    return <FileSpreadsheet className="h-6 w-6 text-blue-600" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getQualityBadge = (score?: number) => {
    if (!score) return null

    if (score >= 80) {
      return <Badge className="bg-green-100 text-green-800">High Quality ({score}%)</Badge>
    } else if (score >= 60) {
      return <Badge className="bg-yellow-100 text-yellow-800">Medium Quality ({score}%)</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">Low Quality ({score}%)</Badge>
    }
  }

  const completedFiles = files.filter((f) => f.status === "completed")

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Your Data</h1>
        <p className="text-gray-600">
          Upload CSV, Excel, or JSON files. Our ETL pipeline will automatically clean and process your data.
        </p>
      </div>

      {/* Upload Area */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>File Upload with ETL Processing</CardTitle>
          <CardDescription>
            Drag and drop your files here or click to browse. Supported formats: CSV, XLSX, XLS, JSON
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">Drop your files here</p>
            <p className="text-gray-500 mb-4">Files will be automatically processed through our ETL pipeline</p>
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                Browse Files
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".csv,.xlsx,.xls,.json"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Processing Status</CardTitle>
            <CardDescription>Track the progress of your file uploads and ETL processing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {files.map((file) => (
              <div key={file.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                {getFileIcon(file.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium truncate">{file.name}</p>
                    {getQualityBadge(file.qualityScore)}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{formatFileSize(file.size)}</p>

                  <div className="mb-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="capitalize">{file.status}</span>
                      <span>{file.progress}%</span>
                    </div>
                    <Progress value={file.progress} className="h-2" />
                  </div>

                  {file.status === "error" && file.error && (
                    <Alert className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{file.error}</AlertDescription>
                    </Alert>
                  )}

                  {file.issues && file.issues.length > 0 && (
                    <Alert className="mt-2">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <div className="text-sm">
                          <p className="font-medium mb-1">Data Quality Issues:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {file.issues.slice(0, 3).map((issue, index) => (
                              <li key={index}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {file.status === "completed" && <CheckCircle className="h-5 w-5 text-green-600" />}
                  <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Success Message and Next Steps */}
      {completedFiles.length > 0 && (
        <Alert className="mb-8">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {completedFiles.length} file{completedFiles.length > 1 ? "s" : ""} processed successfully through ETL
            pipeline! Data has been cleaned, validated, and is ready for visualization.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={() => router.push("/dashboard")} disabled={completedFiles.length === 0} size="lg">
          Create Dashboard
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href="/">Back to Home</a>
        </Button>
      </div>
    </div>
  )
}
