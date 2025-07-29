"use client"

import type { ProcessedData } from "./etl-processor"

export interface Dataset {
  id: string
  name: string
  originalName: string
  type: string
  size: number
  uploadDate: string
  status: "uploading" | "processing" | "completed" | "error"
  processedData?: ProcessedData
  visualizationData?: any
  error?: string
}

class DataStore {
  private datasets: Map<string, Dataset> = new Map()
  private listeners: Set<() => void> = new Set()

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }

  addDataset(dataset: Dataset) {
    this.datasets.set(dataset.id, dataset)
    this.notify()
  }

  updateDataset(id: string, updates: Partial<Dataset>) {
    const dataset = this.datasets.get(id)
    if (dataset) {
      this.datasets.set(id, { ...dataset, ...updates })
      this.notify()
    }
  }

  getDataset(id: string): Dataset | undefined {
    return this.datasets.get(id)
  }

  getAllDatasets(): Dataset[] {
    return Array.from(this.datasets.values())
  }

  deleteDataset(id: string) {
    this.datasets.delete(id)
    this.notify()
  }

  getCompletedDatasets(): Dataset[] {
    return this.getAllDatasets().filter((d) => d.status === "completed")
  }
}

export const dataStore = new DataStore()
