"use client"

import React, { useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { saveAs } from "file-saver"
import Papa from "papaparse"

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

  const [activeTab, setActiveTab] = useState("matched")
  const [apricotFilter, setApricotFilter] = useState("")
  const [onesiteFilter, setOnesiteFilter] = useState("")

  const [filterOptions, setFilterOptions] = useState({
    matched: { apricot: [] as string[], onesite: [] as string[] },
    unmatched: { apricot: [] as string[], onesite: [] as string[] },
    name_matched: { apricot: [] as string[], onesite: [] as string[] },
    dob_matched: { apricot: [] as string[], onesite: [] as string[] },
  })

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
      .then((data) => {
        setResponseData(data as MergeResponse)
        setFilteredData(data as MergeResponse)

        setFilterOptions({
          matched: {
            apricot: getUnique(data.matched, "Building (Apricot)"),
            onesite: getUnique(data.matched, "Building (Onesite)"),
          },
          unmatched: {
            apricot: getUnique(data.unmatched, "Property"),
            onesite: getUnique(data.unmatched, "Building"),
          },
          name_matched: {
            apricot: getUnique(data.name_matched, "Property"),
            onesite: getUnique(data.name_matched, "Building"),
          },
          dob_matched: {
            apricot: getUnique(data.dob_matched, "Property"),
            onesite: getUnique(data.dob_matched, "Building"),
          },
        })
      })
      .catch((err) => {
        console.error(err)
        setError("Failed to fetch merge results.")
      })
      .finally(() => setLoading(false))
  }, [])

  const getUnique = (data: any[], key: string) => {
    return Array.from(new Set(data.map((row) => row[key]).filter(Boolean)))
  }

  const getFilterKeys = () => {
    switch (activeTab) {
      case "matched":
        return ["Building (Apricot)", "Building (Onesite)"]
      default:
        return ["Property", "Building"]
    }
  }

  const applyFilters = () => {
    if (!responseData) return

    const [apricotCol, onesiteCol] = getFilterKeys()

    const filterFunc = (row: any) => {
      const matchApricot = !apricotFilter || row[apricotCol] === apricotFilter
      const matchOnesite = !onesiteFilter || row[onesiteCol] === onesiteFilter
      return matchApricot || matchOnesite
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
      setApricotFilter("")
      setOnesiteFilter("")
    }
  }

  const exportAll = () => {
    if (!responseData) return
    const types = ["matched", "unmatched", "name_matched", "dob_matched"] as const
    types.forEach((type) => {
      const csv = Papa.unparse(responseData[type].map(({ "Matched in both": _, "Unmatched Apricot": __, "Unmatched Onesite": ___, ...rest }) => rest))
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
      saveAs(blob, `${type}.csv`)
    })
  }

  const renderTable = (data: any[]) => {
    if (!data || data.length === 0) return <p className="text-muted-foreground">No records found.</p>
    const columns = Object.keys(data[0]).filter(col => !["Matched in both", "Unmatched Apricot", "Unmatched Onesite"].includes(col))
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
            {data.map((row, idx) => {
              const bg = row["Matched in both"] ? "bg-[#ECFAE5]" : row["Unmatched Apricot"] ? "bg-[#FFE8CD]" : "bg-[#EECAD5]"
              return (
                <TableRow key={idx} className={bg}>
                  {columns.map((col) => (
                    <TableCell key={col}>{row[col]}</TableCell>
                  ))}
                </TableRow>
              )
            })}
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
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          Merge Results
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
              <TooltipContent>
                <p><span className="font-medium">Green</span>: Matched in both</p>
                <p><span className="font-medium">Orange</span>: Unmatched Apricot</p>
                <p><span className="font-medium">Pink</span>: Unmatched Onesite</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h1>
        <div className="flex gap-2">
          <Button onClick={exportAll}>Export CSVs</Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Filter</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter</SheetTitle>
                <SheetDescription>Use dropdown filters for selected tab.</SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2 px-2">
                  <Label>Apricot Filter</Label>
                  <Select value={apricotFilter} onValueChange={setApricotFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select apricot property" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions[activeTab].apricot.map((val) => (
                        <SelectItem key={val} value={val}>{val}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2 px-2">
                  <Label>Onesite Filter</Label>
                  <Select value={onesiteFilter} onValueChange={setOnesiteFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select onesite property" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions[activeTab].onesite.map((val) => (
                        <SelectItem key={val} value={val}>{val}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SheetFooter>
                <Button onClick={applyFilters}>Apply</Button>
                <Button variant="outline" onClick={resetFilters}>Reset</Button>
                <SheetClose asChild>
                  <Button variant="ghost">Close</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Tabs defaultValue="matched" onValueChange={(val) => setActiveTab(val)}>
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