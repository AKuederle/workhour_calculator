export type Holiday = {
  name: string
  date: Date
  isWeekday: boolean
}

export type MonthlyHolidays = {
  [month: number]: Holiday[]
}

export type Country = {
  code: string
  name: string
}

export type Subdivision = {
  code: string
  name: string
}

export type LocationSelectorProps = {
  countries: Country[]
  years: string[]
  onFetchSubdivisions: (countryCode: string) => Promise<Subdivision[]>
} 