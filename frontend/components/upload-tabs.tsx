"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
  const [onesiteFiles, setOnesiteFiles] = useState<File[]>([])
  const [apricotFile, setApricotFile] = useState<File | null>(null)
  const [onesiteUploading, setOnesiteUploading] = useState(false)
  const [apricotUploading, setApricotUploading] = useState(false)
  const router = useRouter()

  const handleOnesiteFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setOnesiteFiles(prev => {
        const combined = [...prev, ...newFiles]
        const uniqueByName = Array.from(new Map(combined.map(f => [f.name, f])).values())
        return uniqueByName
      })
    }
  }

  const handleApricotFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setApricotFile(e.target.files[0])
    }
  }

  const handleNext = async () => {
    if (onesiteFiles.length === 0 || !apricotFile) return

    try {
      setOnesiteUploading(true)
      setApricotUploading(true)

      // Upload OneSite multiple files
      const onesiteForm = new FormData()
      onesiteFiles.forEach(file => onesiteForm.append("files", file))
      const onesiteRes = await fetch(`${API_BASE_URL}/upload/onesite/`, {
        method: "POST",
        body: onesiteForm,
      })
      const onesiteData = await onesiteRes.json()
      if (!onesiteRes.ok) throw new Error("OneSite upload failed")

      // Upload Apricot single file
      const apricotForm = new FormData()
      apricotForm.append("file", apricotFile)
      const apricotRes = await fetch(`${API_BASE_URL}/upload/apricot/`, {
        method: "POST",
        body: apricotForm,
      })
      const apricotData = await apricotRes.json()
      if (!apricotRes.ok) throw new Error("Apricot upload failed")

      // Store in localStorage
      localStorage.setItem("onesiteData", JSON.stringify(onesiteData))
      localStorage.setItem("apricotData", JSON.stringify(apricotData))

      router.push("/merge")
    } catch (err) {
      alert("Upload failed. Please try again.")
    } finally {
      setOnesiteUploading(false)
      setApricotUploading(false)
    }
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
                Upload multiple `.xls` files. The uploaded file names will appear below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="onesite-file">Select .xls files</Label>
              <Input
                id="onesite-file"
                type="file"
                accept=".xls"
                multiple
                onChange={handleOnesiteFilesChange}
              />
              <ul className="text-sm mt-2 list-disc list-inside">
                {onesiteFiles.map((file, idx) => (
                  <li key={idx}>{file.name}</li>
                ))}
              </ul>
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
                onChange={handleApricotFileChange}
              />
              {apricotFile && (
                <p className="text-sm mt-2">Selected: {apricotFile.name}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* NEXT BUTTON */}
      <div className="flex justify-end">
        <Button
          className="mt-2"
          disabled={onesiteFiles.length === 0 || !apricotFile || onesiteUploading || apricotUploading}
          onClick={handleNext}
        >
          {onesiteUploading || apricotUploading ? "Uploading..." : "Next"}
        </Button>
      </div>
    </div>
  )
}