"use client"

import type React from "react"
import { useState } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, Calendar } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatDateRange, parseDateRangeString } from "@/lib/dateUtils"
import { useFormContext } from "react-hook-form"
import { type FormValues } from "./country-subdivision-selector"

interface VacationDateSelectorProps {
  selectedYear: number
}

export default function VacationDateSelector({ selectedYear }: VacationDateSelectorProps) {
  const { setValue, setError,watch, trigger} = useFormContext<FormValues>()
  const [inputValue, setInputValue] = useState("")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  const dateRanges = watch("dateRanges") || []

  const handleInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      await handleFreeTextDateRangeSubmit()
    }
  }

  const handleFreeTextDateRangeSubmit = async () => {
    try {
      const newRanges = parseDateRangeString(inputValue, selectedYear)
      setValue("dateRanges", [...dateRanges, ...newRanges], { shouldValidate: false })
      setInputValue("")
      await trigger(["dateRanges"])
    } catch {
      setError("dateRanges", { message: "Invalid date format" })
    }
  }

  const handleDateRangeSelect = async (dates: [Date | null, Date | null]) => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
    if (start && end) {
      setValue("dateRanges", [...dateRanges, { start, end }], { shouldValidate: false })
      setStartDate(null)
      setEndDate(null)
      await trigger("dateRanges")
      // Close the popover
      const popoverTrigger = document.querySelector('[data-state="open"]')
      if (popoverTrigger instanceof HTMLElement) {
        popoverTrigger.click()
      }
    }
  }

  const handleRemoveRange = async (index: number) => {
    setValue(
      "dateRanges",
      dateRanges.filter((_, i: number) => i !== index),
      { shouldValidate: false }
    )
    await trigger("dateRanges")
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex space-x-2">
          <div className="relative flex-grow">
            <Input
              placeholder="Enter dates (e.g., 23.04;24.04-27.04;23.06)"
              aria-label="Enter vacation dates"
              onKeyDown={handleInputKeyDown}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  aria-label="Open date picker"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={handleDateRangeSelect}
                  inline
                  showYearDropdown={false}
                  showMonthYearPicker={false}
                  dateFormat="dd.MM"
                  minDate={new Date(selectedYear, 0, 1)}
                  maxDate={new Date(selectedYear, 11, 31)}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={handleFreeTextDateRangeSubmit}>Add</Button>
        </div>
      </div>

      <div className="space-y-2">
        {dateRanges.map((range, index) => (
          <Card key={index}>
            <CardContent className="flex items-center justify-between p-2">
              <span>{formatDateRange(range)}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveRange(index)}
                aria-label={`Remove date ${formatDateRange(range)}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

