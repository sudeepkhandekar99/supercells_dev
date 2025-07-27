"use client"

import React, { useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export default function MergeResultsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [responseData, setResponseData] = useState<{
    matched: any[]
    unmatched: any[]
    name_matched: any[]
    dob_matched: any[]
  } | null>(null)

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
      .then((data) => setResponseData(data))
      .catch((err) => {
        console.error(err)
        setError("Failed to fetch merge results.")
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="p-6">Loading merge results...</p>
  if (error) return <p className="p-6 text-red-500">{error}</p>
  if (!responseData) return <p className="p-6">No data returned.</p>

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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Merge Results</h1>
      <Tabs defaultValue="matched">
        <TabsList className="mb-4">
          <TabsTrigger value="matched">All Matched</TabsTrigger>
          <TabsTrigger value="unmatched">Unmatched</TabsTrigger>
          <TabsTrigger value="name_matched">Name Matched</TabsTrigger>
          <TabsTrigger value="dob_matched">DOB Matched</TabsTrigger>
        </TabsList>

        <TabsContent value="matched">{renderTable(responseData.matched)}</TabsContent>
        <TabsContent value="unmatched">{renderTable(responseData.unmatched)}</TabsContent>
        <TabsContent value="name_matched">{renderTable(responseData.name_matched)}</TabsContent>
        <TabsContent value="dob_matched">{renderTable(responseData.dob_matched)}</TabsContent>
      </Tabs>
    </div>
  )
}