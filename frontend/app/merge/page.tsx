"use client"

import React, { useEffect, useState } from "react"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export default function MergePage() {
  const [onesiteCols, setOnesiteCols] = useState<string[]>([])
  const [apricotCols, setApricotCols] = useState<string[]>([])
  const [mergePairs, setMergePairs] = useState<{ onesite: string; apricot: string }[]>([
    { onesite: "", apricot: "" },
  ])

  // Load initial columns from localStorage
  useEffect(() => {
    const onesite = JSON.parse(localStorage.getItem("onesiteData") || "{}")
    const apricot = JSON.parse(localStorage.getItem("apricotData") || "{}")

    setOnesiteCols(onesite.columns || [])
    setApricotCols(apricot.columns || [])

    const savedPairs = JSON.parse(localStorage.getItem("mergePairs") || "[]")
    if (savedPairs.length > 0) setMergePairs(savedPairs)
  }, [])

  // Save to localStorage whenever mergePairs change
  useEffect(() => {
    localStorage.setItem("mergePairs", JSON.stringify(mergePairs))
  }, [mergePairs])

  // Handle select changes
  const handleSelectChange = (
    index: number,
    type: "onesite" | "apricot",
    value: string
  ) => {
    const updated = [...mergePairs]
    updated[index][type] = value
    setMergePairs(updated)

    const isLast = index === mergePairs.length - 1
    if (
      isLast &&
      updated[index].onesite.trim() !== "" &&
      updated[index].apricot.trim() !== ""
    ) {
      setMergePairs([...updated, { onesite: "", apricot: "" }])
    }
  }

  // Delete a row
  const handleDelete = (index: number) => {
    const updated = mergePairs.filter((_, i) => i !== index)
    setMergePairs(updated.length > 0 ? updated : [{ onesite: "", apricot: "" }])
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Select Columns to Merge</h1>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_1fr_auto] gap-4 text-sm font-medium mb-2">
        <div>OneSite Columns</div>
        <div>Apricot Columns</div>
        <div className="text-right">Actions</div>
      </div>

      <Separator className="mb-4" />

      {/* Select rows */}
      <div className="grid gap-4">
        {mergePairs.map((pair, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center"
          >
            {/* OneSite Select */}
            <Select
              value={pair.onesite}
              onValueChange={(val) => handleSelectChange(index, "onesite", val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select OneSite column" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {onesiteCols.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Apricot Select */}
            <Select
              value={pair.apricot}
              onValueChange={(val) => handleSelectChange(index, "apricot", val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Apricot column" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {apricotCols.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Delete button (hide for last empty row) */}
            {!(index === mergePairs.length - 1 && !pair.onesite && !pair.apricot) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <Button
        className="mt-6"
        disabled={mergePairs.filter(p => p.onesite && p.apricot).length === 0}
        onClick={() => window.location.href = "/merge/results"}
      >
        Merge and Continue
      </Button>
    </div>
  )
}