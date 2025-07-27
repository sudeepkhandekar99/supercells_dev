"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export function UploadTabs() {
  const [onesiteResponse, setOnesiteResponse] = useState<any>(null)
  const [apricotResponse, setApricotResponse] = useState<any>(null)
  const router = useRouter()

  const handleFileUpload = async (file: File, type: "onesite" | "apricot") => {
    const formData = new FormData()
    formData.append("file", file)

    const endpoint = `${API_BASE_URL}/upload/${type}/`

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.detail || "Upload failed")

      if (type === "onesite") setOnesiteResponse(data)
      else setApricotResponse(data)

      alert("Upload successful!")
    } catch (error) {
      alert("Upload failed: " + error)
    }
  }

  useEffect(() => {
    if (onesiteResponse && apricotResponse) {
      localStorage.setItem("onesiteData", JSON.stringify(onesiteResponse))
      localStorage.setItem("apricotData", JSON.stringify(apricotResponse))
    }
  }, [onesiteResponse, apricotResponse])

  const handleNext = () => {
    router.push("/merge")
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <Tabs defaultValue="onesite">
        <TabsList>
          <TabsTrigger value="onesite">Upload OneSite</TabsTrigger>
          <TabsTrigger value="apricot">Upload Apricot</TabsTrigger>
        </TabsList>

        {/* OneSite Upload */}
        <TabsContent value="onesite">
          <Card>
            <CardHeader>
              <CardTitle>Upload OneSite Data</CardTitle>
              <CardDescription>
                Upload a `.xls` file and receive cleaned demographic data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="onesite-file">Select .xls file</Label>
              <Input
                id="onesite-file"
                type="file"
                accept=".xls"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file, "onesite")
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Apricot Upload */}
        <TabsContent value="apricot">
          <Card>
            <CardHeader>
              <CardTitle>Upload Apricot Data</CardTitle>
              <CardDescription>
                Upload a `.xlsx` file and receive raw form data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="apricot-file">Select .xlsx file</Label>
              <Input
                id="apricot-file"
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file, "apricot")
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* NEXT BUTTON */}
      <div className="flex justify-end">
        <Button
          className="mt-2"
          disabled={!onesiteResponse || !apricotResponse}
          onClick={handleNext}
        >
          Next
        </Button>
      </div>
    </div>
  )
}