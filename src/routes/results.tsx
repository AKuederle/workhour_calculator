import { createFileRoute } from '@tanstack/react-router'
import { fetchHolidaysByYear } from '@/lib/holidaysApi'
import { differenceInDays, endOfYear, format, getDaysInMonth, isWeekend, startOfYear } from 'date-fns'
import { zodValidator } from '@tanstack/zod-adapter'
import { BaseFormSchema } from '@/components/country-subdivision-selector'
import { cn } from '@/lib/utils'
import { useState } from 'react'

enum WorkDayType {
  WORKDAY = 'WORKDAY',
  WEEKEND = 'WEEKEND',
  HOLIDAY = 'HOLIDAY',
  VACATION = 'VACATION',
}

const getDayIndex = (date: Date) => {
  return differenceInDays(date, startOfYear(date))
}

export const Route = createFileRoute('/results')({
  component: RouteComponent,
  validateSearch: zodValidator(BaseFormSchema),
  loaderDeps: ({ search }) => (search),
  loader: async ({deps: { subdivision, year, vacationDates, offOnChristmasEve, offOnNewYearsEve, protestantCommunity }}) => {
    // Fetch holidays
    let holidays = await fetchHolidaysByYear(year, subdivision)

    if (subdivision === 'DE-BY' && protestantCommunity === true) {
      // In this case we have to remove "Mariä Himmelfahrt"
      console.log('Removing Mariä Himmelfahrt, as we found a protestant community in baveria. n-holidays before: ', holidays.length)
      holidays = holidays.filter(holiday => holiday.name !== 'Mariä Himmelfahrt')
      console.log('n-holidays after: ', holidays.length)
    }

    // If we are off on Christmas Eve and/or New Years Eve, we add them to the holidays
    if (offOnChristmasEve) {
      holidays.push({
        name: 'Christmas Eve',
        date: new Date(year, 11, 24)
      })
    }
    if (offOnNewYearsEve) {
      holidays.push({
        name: 'New Years Eve',
        date: new Date(year, 11, 31)
      })
    }


    if (!vacationDates) {
      return {
        holidays
      }
    }
    // We parse the dates in a super inefficient way, but we want to keep all information to calculate at the end, how many expected workdays are there
    // And how many vacation days are there
    // We create an array for every day of the year and then fill it with values from an enum.
    const yearStart = startOfYear(new Date(year, 0, 1))
    const yearEnd = endOfYear(yearStart)
    const daysInYear = differenceInDays(yearEnd, yearStart) + 1
    const days = Array.from({ length: daysInYear }, () => WorkDayType.WORKDAY)
    // We start by marking all vacation days as VACATION
    vacationDates.forEach(vacationDate => {
      const startDateDayIndex = getDayIndex(vacationDate.start)
      const endDateDayIndex = getDayIndex(vacationDate.end)
      for (let i = startDateDayIndex; i <= endDateDayIndex; i++) {
        days[i] = WorkDayType.VACATION
      }
    })

    // Now we mark all holidays as HOLIDAY
    holidays.forEach(holiday => {
      const holidayDayIndex = getDayIndex(holiday.date)
      days[holidayDayIndex] = WorkDayType.HOLIDAY
    })

    // And finally we mark all weekends as WEEKEND
    days.forEach((_, index) => {
      if (isWeekend(new Date(year, 0, index + 1))) {
        days[index] = WorkDayType.WEEKEND
      }
    })

    const daysPerMonth = Array.from({ length: 12 }, (_, monthIndex) => {
      const monthStart = new Date(new Date().getFullYear(), monthIndex, 1);
      const monthName = format(monthStart, 'MMMM');
      const daysInMonth = getDaysInMonth(monthStart);
      const monthDays = days.slice(
        getDayIndex(monthStart),
        getDayIndex(monthStart) + daysInMonth
      )
      return {
        monthName,
        daysInMonth,
        monthDays
      }
    })

    // Now we calculate the number of workdays per month and the vacation ranges taken.
    // Vacation ranges are calculated by looking for a VACATION day until we find a WORKDAY.
    const workdaysPerMonth = daysPerMonth.map((month, monthIndex) => {
      const vacationRanges = []
      let nVacationDays = 0
      let currentVacationStart: number = -1
      for (let i = 0; i < month.monthDays.length; i++) {
        if (month.monthDays[i] === WorkDayType.VACATION) {
          nVacationDays++
          if (currentVacationStart === -1) {
            currentVacationStart = i
          }
        } else if (month.monthDays[i] === WorkDayType.WORKDAY && currentVacationStart !== -1) {
          // We don't add 1 to the end as the vaction ranges are provided inclusive start and end
          vacationRanges.push({ start: `${currentVacationStart + 1}.${monthIndex + 1}`, end: `${i}.${monthIndex + 1}` })
          currentVacationStart = -1
        }
      }
      if (currentVacationStart !== -1) {
        vacationRanges.push({ start: `${currentVacationStart + 1}.${monthIndex + 1}`, end: `${month.monthDays.length}.${monthIndex + 1}` })
      }
      return {
        daysInMonth: month.daysInMonth,
        workDays: month.monthDays.filter(day => day === WorkDayType.WORKDAY).length,
        vacationDays: nVacationDays,
        vacationRanges
      }
    })

    return {days, workdaysPerMonth}
  },
})


function RouteComponent() {
  const {days, workdaysPerMonth} = Route.useLoaderData()
  const [hoursPerDay, setHoursPerDay] = useState(8)

  if (!days) {
    return <div>No data</div>
  }

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Work Days Summary</h1>
      <div className="bg-gray-100 p-4 rounded space-y-4">
        <div className="flex items-center space-x-2">
          <label htmlFor="hoursPerDay" className="font-medium">Hours per day:</label>
          <input
            id="hoursPerDay"
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(Number(e.target.value))}
            className="border rounded p-1 w-20"
          />
        </div>
        <table className="w-full bg-white border-collapse border">
          <thead>
            <tr className="bg-gray-50">
              <th className="border p-2 text-left">Month</th>
              <th className="border p-2 text-right">Workdays</th>
              <th className="border p-2 text-right">Work Hours</th>
              <th className="border p-2 text-left">Vacation Ranges</th>
            </tr>
          </thead>
          <tbody>
            {workdaysPerMonth.map((month, index) => {
              const vacationRangesStr = month.vacationRanges.length > 0 
                ? month.vacationRanges.map(range => `${range.start}-${range.end}`).join(';')
                : '-'
              const workHours = month.workDays * hoursPerDay
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border p-2">{months[index]}</td>
                  <td className="border p-2 text-right">{month.workDays}</td>
                  <td className="border p-2 text-right">{workHours}</td>
                  <td className="border p-2 font-mono">{vacationRangesStr}</td>
                </tr>
              )
            })}
            <tr className="bg-gray-50 font-semibold">
              <td className="border p-2">Total</td>
              <td className="border p-2 text-right">
                {workdaysPerMonth.reduce((sum, month) => sum + month.workDays, 0)}
              </td>
              <td className="border p-2 text-right">
                {workdaysPerMonth.reduce((sum, month) => sum + month.workDays * hoursPerDay, 0)}
              </td>
              <td className="border p-2"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">Visual Calendar</h2>
      <div className="grid gap-4">
        {Array.from({ length: 12 }, (_, monthIndex) => {
          const monthStart = new Date(new Date().getFullYear(), monthIndex, 1);
          const monthName = format(monthStart, 'MMMM');
          const daysInMonth = getDaysInMonth(monthStart);
          const monthDays = days.slice(
            getDayIndex(monthStart),
            getDayIndex(monthStart) + daysInMonth
          );

          return (
            <div key={monthIndex} className="flex flex-col gap-2">
              <h2 className="font-semibold">{monthName}</h2>
              <div className="flex gap-1">
                {monthDays.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={cn(
                      "w-6 h-6 rounded-sm",
                      day === WorkDayType.WORKDAY && "bg-green-500",
                      day === WorkDayType.VACATION && "bg-blue-500",
                      day === WorkDayType.HOLIDAY && "bg-red-500",
                      day === WorkDayType.WEEKEND && "bg-gray-500"
                    )}
                    title={`${monthName} ${dayIndex + 1}: ${WorkDayType[day]}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}
