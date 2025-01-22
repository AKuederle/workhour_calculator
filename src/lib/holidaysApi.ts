import type { Subdivision, Country } from "@/types"

interface SubdivisionApiResponse {
  code: string
  name: Array<{
    language: string
    text: string
  }>
}

interface HolidayApiResponse {
  startDate: string
  endDate: string
  name: Array<{
    language: string
    text: string
  }>
}

export async function fetchHolidaysByYear(year: number, subdivisionCode: string): Promise<{ name: string; date: Date; }[]> {
  const baseUrl = 'https://openholidaysapi.org/PublicHolidays'
  const countryCode = subdivisionCode.split('-')[0]
  const url = `${baseUrl}?countryIsoCode=${countryCode}&subdivisionCode=${subdivisionCode}&validFrom=${year}-01-01&validTo=${year}-12-31`

  console.log('Fetching holidays from:', url)

  let data: HolidayApiResponse[]
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch holidays: ${response.statusText}. Details: ${errorText}`)
    }
    data = await response.json()
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching holidays:', error)
      throw new Error(`Error fetching holidays: ${error.message}`)
    }
    throw new Error('Unknown error occurred while fetching holidays')
  }
  
  return data.map((holiday: HolidayApiResponse) => {
    const date = new Date(holiday.startDate)

    return {
      name: holiday.name[0].text, // API returns name in multiple languages, we take the first one
      date,
    }
  })
}

export async function fetchSubdivisions(countryCode: string, languageIsoCode: string): Promise<Subdivision[]> {
  const baseUrl = 'https://openholidaysapi.org/Subdivisions'
  const url = `${baseUrl}?countryIsoCode=${countryCode}&languageIsoCode=${languageIsoCode}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch subdevisions: ${response.statusText}`)
  }

  const data: SubdivisionApiResponse[] = await response.json()
  return data.map((subdivision) => ({
    name: subdivision.name[0].text,
    code: subdivision.code
  }))
}

export async function fetchCountries(languageIsoCode: string): Promise<Country[]> {
  const baseUrl = 'https://openholidaysapi.org/Countries'
  const url = `${baseUrl}?languageIsoCode=${languageIsoCode}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch countries: ${response.statusText}`)
  }

  const data: any = await response.json()
  return data.map((country: any) => ({
    name: country.name[0].text,
    code: country.isoCode
  }))
}