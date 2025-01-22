import { createFileRoute, useSearch } from '@tanstack/react-router'
import { fetchHolidaysByYear } from '@/lib/holidaysApi'
import { parseDateOrRangeString } from '@/lib/dateUtils'
import { useEffect, useState } from 'react'
import { differenceInDays, eachDayOfInterval, eachMonthOfInterval, endOfMonth, endOfYear, format, getDaysInMonth, isWeekend, startOfMonth, startOfYear } from 'date-fns'
import { zodValidator } from '@tanstack/zod-adapter'
import { BaseFormSchema } from '@/components/country-subdivision-selector'
import { cn } from '@/lib/utils'

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
  loader: async ({deps: { subdivision, year, vacationDates }}) => {
    // Fetch holidays
    const holidays = await fetchHolidaysByYear(year, subdivision)

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
        } else if (currentVacationStart !== -1) {
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

    const summary = {
      totalWorkDays: workdaysPerMonth.reduce((acc, month) => acc + month.workDays, 0),
      totalVacationDays: workdaysPerMonth.reduce((acc, month) => acc + month.vacationDays, 0),
    }

    return {days, workdaysPerMonth, summary}
  },
})


function RouteComponent() {
  const {days, workdaysPerMonth, summary} = Route.useLoaderData()

  if (!days) {
    return <div>No data</div>
  }

  return (
    <div>
      <h1>Results</h1>
      {JSON.stringify(workdaysPerMonth)}
      {JSON.stringify(summary)}
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
