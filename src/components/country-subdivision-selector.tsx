import { useState, useCallback } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { LocationSelectorProps, Subdivision } from "@/types"

export default function CountrySubdivisionSelector({
  countries,
  years,
  onFetchSubdivisions,
}: LocationSelectorProps) {
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [selectedCountry, setSelectedCountry] = useState<string>("")
  const [selectedSubdivision, setSelectedSubdivision] = useState<string>("")
  const [subdivisions, setSubdivisions] = useState<Subdivision[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Open states for comboboxes
  const [yearOpen, setYearOpen] = useState(false)
  const [countryOpen, setCountryOpen] = useState(false)
  const [subdivisionOpen, setSubdivisionOpen] = useState(false)

  // Fetch subdivisions when country changes
  const handleCountryChange = useCallback(async (value: string) => {
    setSelectedCountry(value)
    setSelectedSubdivision("")
    setError(null)
    
    if (!value) {
      setSubdivisions([])
      return
    }

    setIsLoading(true)
    try {
      const subdivisionData = await onFetchSubdivisions(value)
      setSubdivisions(subdivisionData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch subdivisions")
      setSubdivisions([])
    } finally {
      setIsLoading(false)
    }
  }, [onFetchSubdivisions])

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Location and Year Selector</h1>

      <div>
        <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-1">
          Year
        </label>
        <Popover open={yearOpen} onOpenChange={setYearOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={yearOpen}
              className="w-full justify-between"
            >
              {selectedYear || "Select a year..."}
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search year..." className="h-9" />
              <CommandList>
                <CommandEmpty>No year found.</CommandEmpty>
                <CommandGroup>
                  {years.map((year) => (
                    <CommandItem
                      key={year}
                      value={year}
                      onSelect={(currentValue) => {
                        setSelectedYear(currentValue === selectedYear ? "" : currentValue)
                        setYearOpen(false)
                      }}
                    >
                      {year}
                      <Check
                        className={cn(
                          "ml-auto",
                          selectedYear === year ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <label htmlFor="country-select" className="block text-sm font-medium text-gray-700 mb-1">
          Country
        </label>
        <Popover open={countryOpen} onOpenChange={setCountryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={countryOpen}
              className="w-full justify-between"
            >
              {selectedCountry
                ? `${countries.find((c) => c.code === selectedCountry)?.name} (${selectedCountry})`
                : "Select a country..."}
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search country..." className="h-9" />
              <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {countries.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={`${country.code} ${country.name}`}
                      onSelect={() => {
                        handleCountryChange(country.code === selectedCountry ? "" : country.code)
                        setCountryOpen(false)
                      }}
                    >
                      {country.name} ({country.code})
                      <Check
                        className={cn(
                          "ml-auto",
                          selectedCountry === country.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <label htmlFor="subdivision-select" className="block text-sm font-medium text-gray-700 mb-1">
          Subdivision
        </label>
        <Popover 
          open={subdivisionOpen} 
          onOpenChange={setSubdivisionOpen}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={subdivisionOpen}
              className="w-full justify-between"
              disabled={!selectedCountry || isLoading}
            >
              {isLoading ? "Loading..." : 
                selectedSubdivision
                  ? `${subdivisions.find((s) => s.code === selectedSubdivision)?.name} (${selectedSubdivision})`
                  : "Select a subdivision..."}
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search subdivision..." className="h-9" />
              <CommandList>
                <CommandEmpty>No subdivision found.</CommandEmpty>
                <CommandGroup>
                  {subdivisions.map((subdivision) => (
                    <CommandItem
                      key={subdivision.code}
                      value={`${subdivision.code} ${subdivision.name}`}
                      onSelect={() => {
                        setSelectedSubdivision(subdivision.code === selectedSubdivision ? "" : subdivision.code)
                        setSubdivisionOpen(false)
                      }}
                    >
                      {subdivision.name}
                      <Check
                        className={cn(
                          "ml-auto",
                          selectedSubdivision === subdivision.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Selected Values:</h2>
        <p>
          <strong>Year:</strong> {selectedYear || "Not selected"}
        </p>
        <p>
          <strong>Country:</strong>{" "}
          {selectedCountry
            ? `${countries.find((c) => c.code === selectedCountry)?.name} (${selectedCountry})`
            : "Not selected"}
        </p>
        <p>
          <strong>Subdivision:</strong>{" "}
          {selectedSubdivision
            ? `${subdivisions.find((s) => s.code === selectedSubdivision)?.name} (${selectedSubdivision})`
            : "Not selected"}
        </p>
      </div>
    </div>
  )
}

