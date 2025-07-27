import { UploadTabs } from "@/components/upload-tabs"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-semibold mb-6">Upload Demographics Data</h1>
      <UploadTabs />
    </main>
  )
}