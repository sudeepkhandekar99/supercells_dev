"use client"

import React, { useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

type MergeResponse = {
  matched: any[]
  unmatched: any[]
  name_matched: any[]
  dob_matched: any[]
}

export default function MergeResultsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [responseData, setResponseData] = useState<MergeResponse | null>(null)
  const [filteredData, setFilteredData] = useState<MergeResponse | null>(null)

  const [onesiteOptions, setOnesiteOptions] = useState<string[]>([])
  const [apricotOptions, setApricotOptions] = useState<string[]>([])

  const [onesiteBuildingFilter, setOnesiteBuildingFilter] = useState<string | null>(null)
  const [apricotBuildingFilter, setApricotBuildingFilter] = useState<string | null>(null)
  const [filterLogic, setFilterLogic] = useState<"OR" | "AND">("OR")

  useEffect(() => {
    const apricotData = JSON.parse(localStorage.getItem("apricotData") || "[]")
    const onesiteData = JSON.parse(localStorage.getItem("onesiteData") || "[]")
    const mergePairs = JSON.parse(localStorage.getItem("mergePairs") || "[]")

    const validPairs = mergePairs.filter(
      (p: any) => p.onesite?.trim() !== "" && p.apricot?.trim() !== ""
    )

    const payload = {
      apricot_data: apricotData.data || [],
      onesite_data: onesiteData.data || [],
      merge_columns: validPairs,
    }

    fetch(`${API_BASE_URL}/merge/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data: MergeResponse) => {
        setResponseData(data)
        setFilteredData(data)
        extractOptions(data)
      })
      .catch((err) => {
        console.error(err)
        setError("Failed to fetch merge results.")
      })
      .finally(() => setLoading(false))
  }, [])

  const extractOptions = (data: MergeResponse) => {
    const allRows = [
      ...data.matched,
      ...data.unmatched,
      ...data.name_matched,
      ...data.dob_matched,
    ]

    const apricotSet = new Set<string>()
    const onesiteSet = new Set<string>()

    for (const row of allRows) {
      if (row["Building (Apricot)"]) apricotSet.add(row["Building (Apricot)"])
      if (row["Building (Onesite)"]) onesiteSet.add(row["Building (Onesite)"])
    }

    setApricotOptions(Array.from(apricotSet))
    setOnesiteOptions(Array.from(onesiteSet))
  }

  const applyFilters = () => {
    if (!responseData) return

    const filterFunc = (row: any) => {
      const matchOnesite = !onesiteBuildingFilter || row["Building (Onesite)"] === onesiteBuildingFilter
      const matchApricot = !apricotBuildingFilter || row["Building (Apricot)"] === apricotBuildingFilter

      return filterLogic === "AND"
        ? matchOnesite && matchApricot
        : matchOnesite || matchApricot
    }

    setFilteredData({
      matched: responseData.matched.filter(filterFunc),
      unmatched: responseData.unmatched.filter(filterFunc),
      name_matched: responseData.name_matched.filter(filterFunc),
      dob_matched: responseData.dob_matched.filter(filterFunc),
    })
  }

  const resetFilters = () => {
    if (responseData) {
      setFilteredData(responseData)
      setOnesiteBuildingFilter(null)
      setApricotBuildingFilter(null)
      setFilterLogic("OR")
    }
  }

  const renderTable = (data: any[]) => {
    if (!data || data.length === 0) return <p className="text-muted-foreground">No records found.</p>

    const columns = Object.keys(data[0])

    return (
      <div className="overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col}>{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx}>
                {columns.map((col) => (
                  <TableCell key={col}>{row[col]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (loading) return <p className="p-6">Loading merge results...</p>
  if (error) return <p className="p-6 text-red-500">{error}</p>
  if (!filteredData) return <p className="p-6">No data returned.</p>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Merge Results</h1>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Filter</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter by Property</SheetTitle>
              <SheetDescription>Select building filters below.</SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2 px-2">
                <Label>Building (Onesite)</Label>
                <Select value={onesiteBuildingFilter ?? ""} onValueChange={setOnesiteBuildingFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Onesite Building" />
                  </SelectTrigger>
                  <SelectContent>
                    {onesiteOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 px-2">
                <Label>Building (Apricot)</Label>
                <Select value={apricotBuildingFilter ?? ""} onValueChange={setApricotBuildingFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Apricot Building" />
                  </SelectTrigger>
                  <SelectContent>
                    {apricotOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 px-2">
                <Label>Filter Logic</Label>
                <Select value={filterLogic} onValueChange={(val) => setFilterLogic(val as "OR" | "AND") }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OR">OR</SelectItem>
                    <SelectItem value="AND">AND</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SheetFooter>
              <Button onClick={applyFilters}>Apply</Button>
              <Button variant="outline" onClick={resetFilters}>
                Reset
              </Button>
              <SheetClose asChild>
                <Button variant="ghost">Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <Tabs defaultValue="matched">
        <TabsList className="mb-4">
          <TabsTrigger value="matched">All Matched</TabsTrigger>
          <TabsTrigger value="unmatched">Unmatched</TabsTrigger>
          <TabsTrigger value="name_matched">Name Matched</TabsTrigger>
          <TabsTrigger value="dob_matched">DOB Matched</TabsTrigger>
        </TabsList>

        <TabsContent value="matched">{renderTable(filteredData.matched)}</TabsContent>
        <TabsContent value="unmatched">{renderTable(filteredData.unmatched)}</TabsContent>
        <TabsContent value="name_matched">{renderTable(filteredData.name_matched)}</TabsContent>
        <TabsContent value="dob_matched">{renderTable(filteredData.dob_matched)}</TabsContent>
      </Tabs>
    </div>
  )
}