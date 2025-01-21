import { useState } from "react"
import VacationDateSelector from "../components/VacationDateSelector"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function Home() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const years = Array.from({ length: 10 }, (_, i) => selectedYear + i)

  return (
    <main className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Vacation Date Selector</h1>
      <div className="mb-4">
        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number.parseInt(value))}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <VacationDateSelector selectedYear={selectedYear} />
    </main>
  )
}

