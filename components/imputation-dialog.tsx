"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InlineBadge } from "@/components/ui/inline-badge"
import { AlertTriangle, CheckCircle, Settings } from "lucide-react"
import { DataImputation, type ImputationStrategy } from "@/lib/data-imputation"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImputationDialogProps {
  columns: any[]
  onImpute: (strategies: ImputationStrategy[]) => void
  isProcessing?: boolean
}

export function ImputationDialog({ columns, onImpute, isProcessing = false }: ImputationDialogProps) {
  const [strategies, setStrategies] = useState<ImputationStrategy[]>(() =>
    DataImputation.getRecommendedStrategies(columns),
  )
  const [isOpen, setIsOpen] = useState(false)

  const columnsWithMissingData = columns.filter((col) => col.stats && col.stats.nullCount > 0)

  const updateStrategy = (columnName: string, method: ImputationStrategy["method"], customValue?: any) => {
    setStrategies((prev) =>
      prev.map((strategy) => (strategy.column === columnName ? { ...strategy, method, customValue } : strategy)),
    )
  }

  const handleImpute = () => {
    onImpute(strategies)
    setIsOpen(false)
  }

  const getMethodDescription = (method: string) => {
    switch (method) {
      case "mean":
        return "Replace with average value"
      case "median":
        return "Replace with middle value"
      case "mode":
        return "Replace with most frequent value"
      case "forward_fill":
        return "Use previous valid value"
      case "backward_fill":
        return "Use next valid value"
      case "interpolation":
        return "Calculate intermediate values"
      case "custom":
        return "Replace with custom value"
      default:
        return ""
    }
  }

  const getAvailableMethods = (columnType: string): ImputationStrategy["method"][] => {
    switch (columnType) {
      case "number":
        return ["mean", "median", "mode", "forward_fill", "backward_fill", "interpolation", "custom"]
      case "string":
        return ["mode", "forward_fill", "backward_fill", "custom"]
      case "date":
        return ["forward_fill", "backward_fill", "custom"]
      case "boolean":
        return ["mode", "custom"]
      default:
        return ["mode", "custom"]
    }
  }

  if (columnsWithMissingData.length === 0) {
    return (
      <Alert>
        <AlertDescription>No missing data found in the selected columns.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Settings className="h-4 w-4" />
          Fix Missing Data
          <InlineBadge variant="destructive" className="ml-2">
            {columnsWithMissingData.length}
          </InlineBadge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Data Imputation Settings</DialogTitle>
          <DialogDescription>
            Configure how to handle missing values in your dataset. Choose appropriate methods for each column.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {columnsWithMissingData.map((column) => {
            const strategy = strategies.find((s) => s.column === column.name)
            const availableMethods = getAvailableMethods(column.type)

            return (
              <Card key={column.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{column.name}</CardTitle>
                      <CardDescription>
                        <InlineBadge variant="outline" className="mr-2">
                          {column.type}
                        </InlineBadge>
                        {column.stats.nullCount} missing values (
                        {((column.stats.nullCount / (column.stats.nullCount + column.stats.uniqueCount)) * 100).toFixed(
                          1,
                        )}
                        %)
                      </CardDescription>
                    </div>
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`method-${column.name}`}>Imputation Method</Label>
                      <Select
                        value={strategy?.method || "mode"}
                        onValueChange={(value) => updateStrategy(column.name, value as ImputationStrategy["method"])}
                      >
                        <SelectTrigger id={`method-${column.name}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMethods.map((method) => (
                            <SelectItem key={method} value={method}>
                              <div>
                                <div className="font-medium capitalize">{method.replace("_", " ")}</div>
                                <div className="text-xs text-muted-foreground">{getMethodDescription(method)}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {strategy?.method === "custom" && (
                      <div>
                        <Label htmlFor={`custom-${column.name}`}>Custom Value</Label>
                        <Input
                          id={`custom-${column.name}`}
                          placeholder="Enter custom value"
                          value={strategy.customValue || ""}
                          onChange={(e) => updateStrategy(column.name, "custom", e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {column.type === "number" && column.stats && (
                    <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                      <div className="grid grid-cols-3 gap-4">
                        <div>Min: {column.stats.min?.toFixed(2)}</div>
                        <div>Max: {column.stats.max?.toFixed(2)}</div>
                        <div>Avg: {column.stats.avg?.toFixed(2)}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleImpute} disabled={isProcessing}>
            {isProcessing ? "Processing..." : "Apply Imputation"}
            <CheckCircle className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
