"use client"

import { useState, useEffect } from "react"
import { dataStore, type Dataset } from "@/lib/data-store"

export function useDataStore() {
  const [datasets, setDatasets] = useState<Dataset[]>([])

  useEffect(() => {
    const updateDatasets = () => {
      setDatasets(dataStore.getAllDatasets())
    }

    updateDatasets()
    const unsubscribe = dataStore.subscribe(updateDatasets)
    return unsubscribe
  }, [])

  return {
    datasets,
    addDataset: (dataset: Dataset) => dataStore.addDataset(dataset),
    updateDataset: (id: string, updates: Partial<Dataset>) => dataStore.updateDataset(id, updates),
    getDataset: (id: string) => dataStore.getDataset(id),
    deleteDataset: (id: string) => dataStore.deleteDataset(id),
    completedDatasets: datasets.filter((d) => d.status === "completed"),
  }
}
