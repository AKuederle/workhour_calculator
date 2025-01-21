import { createFileRoute } from '@tanstack/react-router'
import { fetchCountries, fetchSubdivisions } from '@/lib/holidaysApi'
import CountrySubdivisionSelector, { FormValues } from '@/components/country-subdivision-selector'

export const Route = createFileRoute('/')({
  component: MainApp,
  loader: async () => {
    // Get browser locale, fallback to 'en' if not available
    const locale = navigator.language.split('-')[0] || 'en'
    
    return {
      countries: await fetchCountries(locale),
      locale
    }
  }
})

// The last 10 years
const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString())



function MainApp() {
    const { countries, locale } = Route.useLoaderData()
    const navigate = Route.useNavigate()

    function handleSubmit(data: FormValues) {
      // Navigate to the results route with the form data
      navigate({
        to: '/results',
        search: {
          country: data.country,
          subdivision: data.subdivision,
          year: data.year,
          vacationDates: data.vacationDates
        }
      });
    }
  return (
    <div className="p-2">
      <CountrySubdivisionSelector countries={countries} years={years} onFetchSubdivisions={(countryCode) => fetchSubdivisions(countryCode, locale)} onSubmit={handleSubmit}/>
    </div>
  )
}