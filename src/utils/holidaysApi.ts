interface Holiday {
  name: string;
  date: Date;
  isWeekday: boolean;
}

interface MonthlyHolidays {
  [month: number]: Holiday[];
}

interface HolidayApiResponse {
  startDate: string;
  endDate: string;
  name: Array<{
    language: string;
    text: string;
  }>;
}

export async function fetchHolidaysByYear(year: number, subdivisionCode: string): Promise<MonthlyHolidays> {
  const baseUrl = 'https://openholidaysapi.org/PublicHolidays';
  const countryCode = subdivisionCode.split('-')[0];
  const url = `${baseUrl}?countryIsoCode=${countryCode}&subdivisionCode=${subdivisionCode}&validFrom=${year}-01-01&validTo=${year}-12-31`;

  console.log('Fetching holidays from:', url);

  let data: HolidayApiResponse[];
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch holidays: ${response.statusText}. Details: ${errorText}`);
    }
    data = await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching holidays: ${error.message}`);
    }
    throw new Error('Unknown error occurred while fetching holidays');
  }
    
  // Transform and group the holidays by month
  const holidaysByMonth: MonthlyHolidays = {};
  
  data.forEach((holiday: HolidayApiResponse) => {
    const date = new Date(holiday.startDate);
    const month = date.getMonth();
    const isWeekday = date.getDay() !== 0 && date.getDay() !== 6;

    if (!holidaysByMonth[month]) {
      holidaysByMonth[month] = [];
    }

    holidaysByMonth[month].push({
      name: holiday.name[0].text, // API returns name in multiple languages, we take the first one
      date,
      isWeekday
    });
  });

  return holidaysByMonth;
} 